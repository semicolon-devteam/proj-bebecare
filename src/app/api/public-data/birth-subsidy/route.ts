export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

interface BusanSubsidyItem {
  gugun: string;
  pay_year: string;
  subsidy_type: string;
  division: string;
  subsidy: string;
  department_name: string;
  basic_date: string;
}

/**
 * GET /api/public-data/birth-subsidy?region=부산&district=중구
 * 출산지원금 조회 (현재 부산광역시 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '부산';
    const district = searchParams.get('district');

    const serviceKey = process.env.DATA_GO_KR_API_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    if (region !== '부산' && region !== '부산광역시') {
      return NextResponse.json({
        error: 'Currently only Busan data is available via API',
        availableRegions: ['부산'],
        message: '현재 부산광역시 출산지원금 API만 연동되어 있습니다. 다른 지역은 추후 지원 예정입니다.',
      }, { status: 200 });
    }

    // 부산 출산지원금 API
    const url = `https://apis.data.go.kr/6260000/BusanChildBirthService/getTblChildBirth?serviceKey=${serviceKey}&numOfRows=200&pageNo=1&resultType=json`;
    const response = await fetch(url);
    const data = await response.json();

    const items: BusanSubsidyItem[] = data?.response?.body?.items?.item || [];

    // 최신 연도만 필터
    const latestYear = Math.max(...items.map(i => parseInt(i.pay_year)));
    let filtered = items.filter(i => parseInt(i.pay_year) === latestYear);

    // 구군 필터
    if (district) {
      const normalizedDistrict = district.replace(/구$|군$/, '');
      filtered = filtered.filter(i => 
        i.gugun.includes(normalizedDistrict) || i.gugun === district
      );
    }

    // 구군별로 그룹핑
    const grouped: Record<string, {
      district: string;
      year: number;
      subsidies: { type: string; division: string; amount: number; department: string }[];
    }> = {};

    for (const item of filtered) {
      if (!grouped[item.gugun]) {
        grouped[item.gugun] = {
          district: item.gugun,
          year: parseInt(item.pay_year),
          subsidies: [],
        };
      }
      grouped[item.gugun].subsidies.push({
        type: item.subsidy_type,
        division: item.division,
        amount: parseInt(item.subsidy),
        department: item.department_name,
      });
    }

    const results = Object.values(grouped).map(g => ({
      ...g,
      subsidies: g.subsidies.sort((a, b) => {
        const order: Record<string, number> = { '첫째아': 1, '둘째아': 2, '셋째아이상': 3 };
        return (order[a.division] || 99) - (order[b.division] || 99);
      }),
    }));

    return NextResponse.json({
      region: '부산광역시',
      year: latestYear,
      totalDistricts: results.length,
      data: results,
      source: 'data.go.kr - 부산광역시_출산지원금 현황',
    });
  } catch (error) {
    console.error('Birth subsidy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
