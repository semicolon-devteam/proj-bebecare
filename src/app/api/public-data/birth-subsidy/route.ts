export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/public-data/birth-subsidy?region=부산&district=중구
 * 
 * DB 캐시 우선, 없으면 직접 API 호출 (폴백)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '부산';
    const district = searchParams.get('district');
    const admin = getSupabaseAdmin();

    if (region !== '부산' && region !== '부산광역시') {
      return NextResponse.json({
        error: 'Currently only Busan data is available via API',
        availableRegions: ['부산'],
        message: '현재 부산광역시 출산지원금 API만 연동되어 있습니다.',
      });
    }

    // 구군 지정 시 개별 캐시 조회
    if (district) {
      const normalizedDistrict = district.replace(/구$|군$/, '');
      const { data: cached } = await admin
        .from('raw_sources')
        .select('raw_data')
        .eq('data_type', 'birth_subsidy')
        .like('data_key', `busan_%${normalizedDistrict}%`)
        .neq('status', 'error')
        .limit(1)
        .single();

      if (cached?.raw_data) {
        return NextResponse.json({ ...(cached.raw_data as object), source: 'cache' });
      }
    }

    // 전체 데이터 캐시 조회
    const { data: cached } = await admin
      .from('raw_sources')
      .select('raw_data, fetched_at')
      .eq('data_type', 'birth_subsidy')
      .eq('data_key', 'busan_all')
      .single();

    if (cached?.raw_data) {
      const result = cached.raw_data as { data?: unknown[] };
      if (district && result.data) {
        const normalizedDistrict = district.replace(/구$|군$/, '');
        result.data = (result.data as { district: string }[]).filter(
          (d) => d.district.includes(normalizedDistrict) || d.district === district
        );
      }
      return NextResponse.json({ ...result, source: 'cache', cachedAt: cached.fetched_at });
    }

    // 캐시 없으면 직접 API 호출 (폴백)
    const serviceKey = process.env.DATA_GO_KR_API_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'No cache and no API key' }, { status: 500 });
    }

    const url = `https://apis.data.go.kr/6260000/BusanChildBirthService/getTblChildBirth?serviceKey=${serviceKey}&numOfRows=200&pageNo=1&resultType=json`;
    const response = await fetch(url);
    const data = await response.json();

    const items = data?.response?.body?.items?.item || [];
    if (items.length === 0) {
      return NextResponse.json({ region: '부산광역시', data: [], source: 'live_empty' });
    }

    const latestYear = Math.max(...items.map((i: { pay_year: string }) => parseInt(i.pay_year)));
    let filtered = items.filter((i: { pay_year: string }) => parseInt(i.pay_year) === latestYear);

    if (district) {
      const normalizedDistrict = district.replace(/구$|군$/, '');
      filtered = filtered.filter((i: { gugun: string }) =>
        i.gugun.includes(normalizedDistrict) || i.gugun === district
      );
    }

    const grouped: Record<string, { district: string; year: number; subsidies: { type: string; division: string; amount: number; department: string }[] }> = {};
    for (const item of filtered) {
      if (!grouped[item.gugun]) {
        grouped[item.gugun] = { district: item.gugun, year: parseInt(item.pay_year), subsidies: [] };
      }
      grouped[item.gugun].subsidies.push({
        type: item.subsidy_type,
        division: item.division,
        amount: parseInt(item.subsidy),
        department: item.department_name,
      });
    }

    return NextResponse.json({
      region: '부산광역시',
      year: latestYear,
      totalDistricts: Object.keys(grouped).length,
      data: Object.values(grouped),
      source: 'live',
    });
  } catch (error) {
    console.error('Birth subsidy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
