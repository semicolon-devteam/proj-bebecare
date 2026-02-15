export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  ageRange: string; // e.g., "0-1개월", "1-3개월"
  priority: 'high' | 'medium' | 'low';
  emoji: string;
}

export const POSTNATAL_CHECKLIST: ChecklistItem[] = [
  // 출생 직후 (0-2주)
  { id: 'birth-report', category: '행정', title: '출생신고', description: '출생 후 1개월 내 주민센터 또는 온라인(정부24)에서 신고', ageRange: '0-2주', priority: 'high', emoji: '📄' },
  { id: 'health-insurance', category: '행정', title: '건강보험 등록', description: '출생신고 후 건강보험공단에 피부양자 등록', ageRange: '0-2주', priority: 'high', emoji: '🏥' },
  { id: 'baby-first-checkup', category: '건강', title: '신생아 건강검진', description: '출생 후 28일 이내 선천성 대사이상 검사', ageRange: '0-4주', priority: 'high', emoji: '👶' },
  { id: 'hepb-vaccine', category: '건강', title: 'B형간염 1차 접종', description: '출생 직후 접종 (병원에서 시행)', ageRange: '0-1주', priority: 'high', emoji: '💉' },
  { id: 'bcg-vaccine', category: '건강', title: 'BCG 접종 (결핵)', description: '생후 4주 이내 접종 권장', ageRange: '0-4주', priority: 'high', emoji: '💉' },

  // 1개월
  { id: 'hepb-2', category: '건강', title: 'B형간염 2차 접종', description: '생후 1개월에 접종', ageRange: '1개월', priority: 'high', emoji: '💉' },
  { id: 'baby-subsidy', category: '행정', title: '영아수당 신청', description: '0~23개월 영아수당 (월 70만원/100만원) 신청', ageRange: '0-1개월', priority: 'high', emoji: '💰' },
  { id: 'postpartum-care', category: '산모', title: '산후조리 계획', description: '산후조리원 또는 산후도우미 서비스 활용', ageRange: '0-1개월', priority: 'medium', emoji: '🤱' },

  // 2개월
  { id: 'dtap-1', category: '건강', title: 'DTaP 1차 접종', description: '디프테리아/파상풍/백일해 1차', ageRange: '2개월', priority: 'high', emoji: '💉' },
  { id: 'ipv-1', category: '건강', title: 'IPV 1차 접종', description: '폴리오 1차 접종', ageRange: '2개월', priority: 'high', emoji: '💉' },
  { id: 'hib-1', category: '건강', title: 'Hib 1차 접종', description: 'b형헤모필루스인플루엔자 1차', ageRange: '2개월', priority: 'high', emoji: '💉' },
  { id: 'pcv-1', category: '건강', title: 'PCV 1차 접종', description: '폐렴구균 1차 접종', ageRange: '2개월', priority: 'high', emoji: '💉' },
  { id: 'rv-1', category: '건강', title: '로타바이러스 1차 접종', description: '경구 투여 백신', ageRange: '2개월', priority: 'medium', emoji: '💉' },

  // 4개월
  { id: 'checkup-4m', category: '건강', title: '영유아 건강검진 1차', description: '생후 4~6개월 건강검진 (무료)', ageRange: '4-6개월', priority: 'high', emoji: '🩺' },
  { id: 'dtap-2', category: '건강', title: 'DTaP 2차 접종', description: '4개월에 2차 접종', ageRange: '4개월', priority: 'high', emoji: '💉' },

  // 6개월
  { id: 'weaning-start', category: '육아', title: '이유식 시작', description: '생후 6개월부터 이유식 도입 (쌀미음부터)', ageRange: '5-6개월', priority: 'high', emoji: '🥣' },
  { id: 'dtap-3', category: '건강', title: 'DTaP 3차 접종', description: '6개월에 3차 접종', ageRange: '6개월', priority: 'high', emoji: '💉' },
  { id: 'flu-vaccine', category: '건강', title: '인플루엔자 접종', description: '생후 6개월부터 매년 접종 (첫해 2회)', ageRange: '6개월+', priority: 'medium', emoji: '💉' },

  // 9-12개월
  { id: 'checkup-9m', category: '건강', title: '영유아 건강검진 2차', description: '생후 9~12개월 건강검진', ageRange: '9-12개월', priority: 'high', emoji: '🩺' },
  { id: 'mmr-1', category: '건강', title: 'MMR 1차 접종', description: '홍역/유행성이하선염/풍진 12개월', ageRange: '12개월', priority: 'high', emoji: '💉' },
  { id: 'varicella', category: '건강', title: '수두 접종', description: '12~15개월에 접종', ageRange: '12-15개월', priority: 'high', emoji: '💉' },
  { id: 'hepa-1', category: '건강', title: 'A형간염 1차 접종', description: '12개월 이후 접종', ageRange: '12개월', priority: 'high', emoji: '💉' },

  // 생활
  { id: 'tummy-time', category: '육아', title: '터미타임 시작', description: '매일 짧은 엎드려 놀기로 목 근력 발달', ageRange: '0-3개월', priority: 'medium', emoji: '🧸' },
  { id: 'sleep-routine', category: '육아', title: '수면 루틴 만들기', description: '일정한 취침 시간과 루틴으로 수면 패턴 형성', ageRange: '3-6개월', priority: 'medium', emoji: '🌙' },
  { id: 'childcare-apply', category: '행정', title: '어린이집 입소 신청', description: '임신 중 또는 출생 후 빨리 신청 권장 (대기 긴 지역 많음)', ageRange: '0-12개월', priority: 'medium', emoji: '🏫' },
  { id: 'baby-passport', category: '행정', title: '여권 발급', description: '해외여행 계획 시 아기 여권 발급 (유효기간 5년)', ageRange: '언제든', priority: 'low', emoji: '✈️' },
];

/**
 * Get checklist items filtered by age range in months
 */
export function getChecklistForAge(ageMonths: number): ChecklistItem[] {
  return POSTNATAL_CHECKLIST.filter(item => {
    const range = item.ageRange;
    // Simple matching logic
    if (range.includes('언제든')) return true;
    if (range.includes('+')) {
      const min = parseInt(range);
      return ageMonths >= min;
    }
    // "X-Y개월" or "X개월" or "X-Y주"
    const monthMatch = range.match(/(\d+)(?:-(\d+))?개월/);
    if (monthMatch) {
      const min = parseInt(monthMatch[1]);
      const max = monthMatch[2] ? parseInt(monthMatch[2]) : min;
      return ageMonths >= min - 1 && ageMonths <= max + 1;
    }
    const weekMatch = range.match(/(\d+)(?:-(\d+))?주/);
    if (weekMatch) {
      const minWeeks = parseInt(weekMatch[1]);
      const maxWeeks = weekMatch[2] ? parseInt(weekMatch[2]) : minWeeks;
      const ageWeeks = ageMonths * 4.3;
      return ageWeeks >= minWeeks - 1 && ageWeeks <= maxWeeks + 2;
    }
    return ageMonths <= 3; // default: show for young babies
  });
}
