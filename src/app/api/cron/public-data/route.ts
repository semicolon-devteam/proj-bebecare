export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function computeChecksum(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

async function upsertRawSource(
  admin: SupabaseClient,
  params: {
    sourceType: 'crawl' | 'api' | 'manual';
    dataType: string;
    dataKey: string;
    rawData: unknown;
    sourceUrl?: string;
    expiresAt?: string;
  }
) {
  const checksum = computeChecksum(params.rawData);

  // Check if data changed
  const { data: existing } = await admin
    .from('raw_sources')
    .select('id, checksum')
    .eq('data_type', params.dataType)
    .eq('data_key', params.dataKey)
    .single();

  if (existing?.checksum === checksum) {
    // Data unchanged, just update fetched_at
    await admin
      .from('raw_sources')
      .update({ fetched_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return { id: existing.id, changed: false };
  }

  // Upsert new/changed data
  const { data, error } = await admin
    .from('raw_sources')
    .upsert({
      source_type: params.sourceType,
      data_type: params.dataType,
      data_key: params.dataKey,
      raw_data: params.rawData,
      checksum,
      source_url: params.sourceUrl,
      status: 'processed',
      fetched_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      expires_at: params.expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'data_type,data_key' })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data!.id, changed: true };
}

// 예방접종 코드 매핑
const VACCINATION_CODES: Record<string, { code: string; ageMonths: number[]; label: string }> = {
  BCG: { code: '01', ageMonths: [0, 1], label: 'BCG (결핵)' },
  HepB: { code: '02', ageMonths: [0, 1, 6], label: 'B형간염' },
  DTaP: { code: '03', ageMonths: [2, 4, 6, 15, 48], label: 'DTaP (디프테리아/파상풍/백일해)' },
  Polio: { code: '04', ageMonths: [2, 4, 6, 48], label: '폴리오' },
  Hib: { code: '05', ageMonths: [2, 4, 6, 12], label: 'Hib (뇌수막염)' },
  PCV: { code: '06', ageMonths: [2, 4, 6, 12], label: '폐렴구균' },
  MMR: { code: '07', ageMonths: [12, 48], label: 'MMR (홍역/유행성이하선염/풍진)' },
  Varicella: { code: '08', ageMonths: [12], label: '수두' },
  JE: { code: '09', ageMonths: [12, 24, 36], label: '일본뇌염' },
  Flu: { code: '10', ageMonths: [6], label: '인플루엔자' },
  HepA: { code: '13', ageMonths: [12, 18], label: 'A형간염' },
  Rotavirus: { code: '14', ageMonths: [2, 4, 6], label: '로타바이러스' },
};

async function syncVaccinations(admin: SupabaseClient, serviceKey: string) {
  const results = { synced: 0, unchanged: 0, errors: 0 };
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 전체 스케줄
  const scheduleData = Object.entries(VACCINATION_CODES).map(([name, v]) => ({
    name, label: v.label, code: v.code, recommendedMonths: v.ageMonths,
  }));

  await upsertRawSource(admin, {
    sourceType: 'api',
    dataType: 'vaccination',
    dataKey: 'schedule',
    rawData: scheduleData,
    sourceUrl: 'data.go.kr - 질병관리청 예방접종 정보',
    expiresAt,
  });

  // 각 접종별 상세
  for (const [name, vac] of Object.entries(VACCINATION_CODES)) {
    try {
      const url = `https://apis.data.go.kr/1790387/vcninfo/getVcnInfo?serviceKey=${serviceKey}&vcnCd=${vac.code}`;
      const response = await fetch(url);
      const text = await response.text();

      const titleMatch = text.match(/<title>([^<]+)<\/title>/);
      const messageMatch = text.match(/<message><!\[CDATA\[([\s\S]*?)\]\]><\/message>/);

      const rawDetail = {
        name, label: vac.label, code: vac.code,
        recommendedMonths: vac.ageMonths,
        title: titleMatch?.[1] || vac.label,
        description: messageMatch?.[1]?.substring(0, 2000) || '',
        rawXml: text.substring(0, 5000), // 원본 XML 보존
      };

      const result = await upsertRawSource(admin, {
        sourceType: 'api',
        dataType: 'vaccination',
        dataKey: `detail_${vac.code}`,
        rawData: rawDetail,
        sourceUrl: url,
        expiresAt,
      });

      result.changed ? results.synced++ : results.unchanged++;
    } catch (e) {
      console.error(`Vaccination sync error for ${name}:`, e);
      // Mark as error
      await admin.from('raw_sources').upsert({
        source_type: 'api',
        data_type: 'vaccination',
        data_key: `detail_${vac.code}`,
        raw_data: { error: String(e) },
        status: 'error',
        error_message: String(e),
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'data_type,data_key' });
      results.errors++;
    }
  }

  return results;
}

async function syncBirthSubsidy(admin: SupabaseClient, serviceKey: string) {
  const results = { synced: 0, unchanged: 0, errors: 0 };
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const url = `https://apis.data.go.kr/6260000/BusanChildBirthService/getTblChildBirth?serviceKey=${serviceKey}&numOfRows=200&pageNo=1&resultType=json`;
    const response = await fetch(url);
    const data = await response.json();
    const items = data?.response?.body?.items?.item || [];

    if (items.length === 0) return results;

    // 원본 전체를 raw_sources에 저장
    await upsertRawSource(admin, {
      sourceType: 'api',
      dataType: 'birth_subsidy',
      dataKey: 'busan_raw',
      rawData: data, // API 응답 전체 보존
      sourceUrl: url,
      expiresAt,
    });

    const latestYear = Math.max(...items.map((i: { pay_year: string }) => parseInt(i.pay_year)));
    const filtered = items.filter((i: { pay_year: string }) => parseInt(i.pay_year) === latestYear);

    // 구군별 그룹핑 (가공 데이터)
    const grouped: Record<string, { district: string; year: number; subsidies: { type: string; division: string; amount: number; department: string }[] }> = {};

    for (const item of filtered) {
      if (!grouped[item.gugun]) {
        grouped[item.gugun] = { district: item.gugun, year: parseInt(item.pay_year), subsidies: [] };
      }
      grouped[item.gugun].subsidies.push({
        type: item.subsidy_type, division: item.division,
        amount: parseInt(item.subsidy), department: item.department_name,
      });
    }

    // 가공된 전체 데이터
    const processedAll = {
      region: '부산광역시', year: latestYear,
      totalDistricts: Object.keys(grouped).length,
      data: Object.values(grouped),
    };

    const allResult = await upsertRawSource(admin, {
      sourceType: 'api',
      dataType: 'birth_subsidy',
      dataKey: 'busan_all',
      rawData: processedAll,
      sourceUrl: 'data.go.kr - 부산광역시 출산지원금',
      expiresAt,
    });
    allResult.changed ? results.synced++ : results.unchanged++;

    // 구군별 개별
    for (const [district, info] of Object.entries(grouped)) {
      const r = await upsertRawSource(admin, {
        sourceType: 'api',
        dataType: 'birth_subsidy',
        dataKey: `busan_${district}`,
        rawData: info,
        sourceUrl: 'data.go.kr - 부산광역시 출산지원금',
        expiresAt,
      });
      r.changed ? results.synced++ : results.unchanged++;
    }
  } catch (e) {
    console.error('Birth subsidy sync error:', e);
    results.errors++;
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceKey = process.env.DATA_GO_KR_API_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const admin = getSupabaseAdmin();

    const [vacResult, subsidyResult] = await Promise.all([
      syncVaccinations(admin, serviceKey),
      syncBirthSubsidy(admin, serviceKey),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vaccination: vacResult,
      birthSubsidy: subsidyResult,
    });
  } catch (error) {
    console.error('Public data sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
