export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

// 어린이 필수 예방접종 코드 매핑
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
 * 또는 ?ageMonths=2 (해당 월령에 필요한 접종 정보)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vcnCd = searchParams.get('vcnCd');
    const ageMonthsParam = searchParams.get('ageMonths');

    const serviceKey = process.env.DATA_GO_KR_API_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // 월령 기반 조회
    if (ageMonthsParam) {
      const ageMonths = parseInt(ageMonthsParam);
      const relevant = Object.entries(VACCINATION_CODES)
        .filter(([, v]) => v.ageMonths.includes(ageMonths))
        .map(([name, v]) => ({ name, ...v }));

      // 각 접종에 대해 API 호출
      const results = await Promise.all(
        relevant.map(async (vac) => {
          try {
            const url = `https://apis.data.go.kr/1790387/vcninfo/getVcnInfo?serviceKey=${serviceKey}&vcnCd=${vac.code}`;
            const response = await fetch(url);
            const text = await response.text();

            // XML에서 title과 message 추출
            const titleMatch = text.match(/<title>([^<]+)<\/title>/);
            const messageMatch = text.match(/<message><!\[CDATA\[([\s\S]*?)\]\]><\/message>/);

            return {
              name: vac.name,
              label: vac.label,
              code: vac.code,
              recommendedMonths: vac.ageMonths,
              title: titleMatch?.[1] || vac.label,
              description: messageMatch?.[1]?.substring(0, 500) || '',
            };
          } catch {
            return {
              name: vac.name,
              label: vac.label,
              code: vac.code,
              recommendedMonths: vac.ageMonths,
              title: vac.label,
              description: '',
            };
          }
        })
      );

      return NextResponse.json({
        ageMonths,
        vaccinations: results,
        totalSchedule: Object.entries(VACCINATION_CODES).map(([name, v]) => ({
          name,
          label: v.label,
          recommendedMonths: v.ageMonths,
        })),
      });
    }

    // 단일 접종 코드 조회
    if (vcnCd) {
      const url = `https://apis.data.go.kr/1790387/vcninfo/getVcnInfo?serviceKey=${serviceKey}&vcnCd=${vcnCd}`;
      const response = await fetch(url);
      const text = await response.text();

      const titleMatch = text.match(/<title>([^<]+)<\/title>/);
      const messageMatch = text.match(/<message><!\[CDATA\[([\s\S]*?)\]\]><\/message>/);

      return NextResponse.json({
        code: vcnCd,
        title: titleMatch?.[1] || '',
        description: messageMatch?.[1] || '',
      });
    }

    // 전체 스케줄 반환
    return NextResponse.json({
      schedule: Object.entries(VACCINATION_CODES).map(([name, v]) => ({
        name,
        label: v.label,
        code: v.code,
        recommendedMonths: v.ageMonths,
      })),
    });
  } catch (error) {
    console.error('Vaccination API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
