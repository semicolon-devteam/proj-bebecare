export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 폴백용 스케줄 (캐시 없을 때)
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

/**
 * GET /api/public-data/vaccination?vcnCd=01
 * 또는 ?ageMonths=2
 * 
 * DB 캐시 우선, 없으면 정적 데이터 폴백
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vcnCd = searchParams.get('vcnCd');
    const ageMonthsParam = searchParams.get('ageMonths');
    const admin = getSupabaseAdmin();

    // 단일 접종 상세 조회
    if (vcnCd) {
      const { data: cached } = await admin
        .from('raw_sources')
        .select('raw_data')
        .eq('data_type', 'vaccination')
        .eq('data_key', `detail_${vcnCd}`)
        .neq('status', 'error')
        .single();

      if (cached?.raw_data) {
        const { rawXml, ...displayData } = cached.raw_data as Record<string, unknown>;
        return NextResponse.json({ ...displayData, source: 'cache' });
      }

      // 캐시 없으면 직접 API 호출 (폴백)
      const serviceKey = process.env.DATA_GO_KR_API_KEY;
      if (serviceKey) {
        try {
          const url = `https://apis.data.go.kr/1790387/vcninfo/getVcnInfo?serviceKey=${serviceKey}&vcnCd=${vcnCd}`;
          const response = await fetch(url);
          const text = await response.text();
          const titleMatch = text.match(/<title>([^<]+)<\/title>/);
          const messageMatch = text.match(/<message><!\[CDATA\[([\s\S]*?)\]\]><\/message>/);
          return NextResponse.json({
            code: vcnCd,
            title: titleMatch?.[1] || '',
            description: messageMatch?.[1] || '',
            source: 'live',
          });
        } catch { /* fall through */ }
      }

      return NextResponse.json({ code: vcnCd, title: '', description: '', source: 'none' });
    }

    // 월령 기반 조회
    if (ageMonthsParam) {
      const ageMonths = parseInt(ageMonthsParam);
      const relevant = Object.entries(VACCINATION_CODES)
        .filter(([, v]) => v.ageMonths.includes(ageMonths))
        .map(([name, v]) => ({ name, ...v }));

      // 캐시에서 상세 정보 가져오기
      const results = await Promise.all(
        relevant.map(async (vac) => {
          const { data: cached } = await admin
            .from('raw_sources')
            .select('raw_data')
            .eq('data_type', 'vaccination')
            .eq('data_key', `detail_${vac.code}`)
            .neq('status', 'error')
            .single();

          if (cached?.raw_data) {
            const { rawXml, ...displayData } = cached.raw_data as Record<string, unknown>;
            return displayData;
          }
          return {
            name: vac.name,
            label: vac.label,
            code: vac.code,
            recommendedMonths: vac.ageMonths,
            title: vac.label,
            description: '',
          };
        })
      );

      return NextResponse.json({
        ageMonths,
        vaccinations: results,
        totalSchedule: Object.entries(VACCINATION_CODES).map(([name, v]) => ({
          name, label: v.label, recommendedMonths: v.ageMonths,
        })),
        source: 'cache',
      });
    }

    // 전체 스케줄
    const { data: cached } = await admin
      .from('raw_sources')
      .select('raw_data')
      .eq('data_type', 'vaccination')
      .eq('data_key', 'schedule')
      .single();

    if (cached?.raw_data) {
      return NextResponse.json({ schedule: cached.raw_data, source: 'cache' });
    }

    // 폴백: 정적 데이터
    return NextResponse.json({
      schedule: Object.entries(VACCINATION_CODES).map(([name, v]) => ({
        name, label: v.label, code: v.code, recommendedMonths: v.ageMonths,
      })),
      source: 'static',
    });
  } catch (error) {
    console.error('Vaccination API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
