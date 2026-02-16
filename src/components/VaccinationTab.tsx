'use client';

import { useEffect, useState, useCallback } from 'react';
import { getChildren, type Child } from '@/lib/children';
import { supabase } from '@/lib/supabase';
import {
  Syringe,
  Check,
  ChevronRight,
  X,
  AlertCircle,
  Baby,
  Calendar,
  Shield,
  Loader2,
} from 'lucide-react';

// ── Static data ──────────────────────────────────────────
interface VaccinationInfo {
  code: string;
  ageMonths: number[];
  label: string;
  disease: string;
  doses: string;
  caution: string;
}

const VACCINATIONS: Record<string, VaccinationInfo> = {
  BCG: {
    code: '01', ageMonths: [0, 1], label: 'BCG (결핵)',
    disease: '결핵', doses: '1회', caution: '피내용만 국가예방접종. 생후 4주 이내 접종 권장.',
  },
  HepB: {
    code: '02', ageMonths: [0, 1, 6], label: 'B형간염',
    disease: 'B형간염', doses: '3회 (0, 1, 6개월)', caution: '출생 후 12시간 이내 1차 접종. 산모 HBsAg 양성 시 HBIG 동시 접종.',
  },
  DTaP: {
    code: '03', ageMonths: [2, 4, 6, 15, 48], label: 'DTaP',
    disease: '디프테리아, 파상풍, 백일해', doses: '5회 (2, 4, 6, 15~18, 48~60개월)', caution: '접종 후 발열, 접종 부위 부종 가능. 이전 접종 후 심한 이상반응 시 의사 상담.',
  },
  Polio: {
    code: '04', ageMonths: [2, 4, 6, 48], label: '폴리오 (IPV)',
    disease: '소아마비', doses: '4회 (2, 4, 6~18, 48~60개월)', caution: '주사용(IPV)만 사용. 경구용(OPV) 사용하지 않음.',
  },
  Hib: {
    code: '05', ageMonths: [2, 4, 6, 12], label: 'Hib (뇌수막염)',
    disease: '뇌수막염 (b형 헤모필루스 인플루엔자)', doses: '4회 (2, 4, 6, 12~15개월)', caution: '5세 이상은 접종 불필요. 접종 부위 통증, 발적 가능.',
  },
  PCV: {
    code: '06', ageMonths: [2, 4, 6, 12], label: '폐렴구균 (PCV)',
    disease: '폐렴구균 감염증', doses: '4회 (2, 4, 6, 12~15개월)', caution: '13가 또는 15가 단백결합 백신. 접종 후 발열 흔함.',
  },
  MMR: {
    code: '07', ageMonths: [12, 48], label: 'MMR',
    disease: '홍역, 유행성이하선염, 풍진', doses: '2회 (12~15, 48~60개월)', caution: '생백신으로 임신부 접종 금지. 접종 후 5~12일째 발열 가능.',
  },
  Varicella: {
    code: '08', ageMonths: [12], label: '수두',
    disease: '수두', doses: '1회 (12~15개월)', caution: '생백신. 접종 후 경미한 수두 유사 발진 가능.',
  },
  JE: {
    code: '09', ageMonths: [12, 24, 36], label: '일본뇌염',
    disease: '일본뇌염', doses: '사백신 5회 또는 생백신 2회', caution: '사백신: 12~23개월 1~2차, 24개월 3차. 생백신: 12~23개월 1차, 24개월 2차.',
  },
  Flu: {
    code: '10', ageMonths: [6], label: '인플루엔자',
    disease: '인플루엔자 (독감)', doses: '매년 1~2회 (생후 6개월부터)', caution: '첫해 4주 간격 2회, 이후 매년 1회. 달걀 알레르기 시 의사 상담.',
  },
  HepA: {
    code: '13', ageMonths: [12, 18], label: 'A형간염',
    disease: 'A형간염', doses: '2회 (12~23, 18~30개월)', caution: '6개월 이상 간격으로 2회 접종. 해외 여행 시 조기 접종 고려.',
  },
  Rotavirus: {
    code: '14', ageMonths: [2, 4, 6], label: '로타바이러스',
    disease: '로타바이러스 위장관염', doses: '경구 2~3회 (2, 4, 6개월)', caution: '경구용 생백신. 첫 접종은 생후 15주 이전에 시작. 장중첩증 주의.',
  },
};

// ── Timeline milestones ──────────────────────────────────
interface TimelineGroup {
  month: number;
  label: string;
  vaccines: { key: string; info: VaccinationInfo; doseIndex: number }[];
}

function buildTimeline(): TimelineGroup[] {
  const monthMap = new Map<number, { key: string; info: VaccinationInfo; doseIndex: number }[]>();

  Object.entries(VACCINATIONS).forEach(([key, info]) => {
    info.ageMonths.forEach((m, doseIndex) => {
      if (!monthMap.has(m)) monthMap.set(m, []);
      monthMap.get(m)!.push({ key, info, doseIndex });
    });
  });

  const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0] - b[0]);
  return sorted.map(([month, vaccines]) => ({
    month,
    label: month === 0 ? '출생' : `${month}개월`,
    vaccines,
  }));
}

// ── Helper: child age in months ──────────────────────────
function getAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

// ── Types ────────────────────────────────────────────────
interface VaccinationLog {
  id: string;
  vaccineKey: string;
  doseIndex: number;
  completedAt: string;
}

// ── Component ────────────────────────────────────────────
export default function VaccinationTab({ userId }: { userId: string }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [completedVaccinations, setCompletedVaccinations] = useState<VaccinationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [detailVaccine, setDetailVaccine] = useState<{ key: string; info: VaccinationInfo } | null>(null);
  const [apiDetails, setApiDetails] = useState<Record<string, Record<string, string>>>({});

  const timeline = buildTimeline();

  // Load children
  useEffect(() => {
    (async () => {
      const kids = await getChildren(userId);
      const bornKids = kids.filter(c => c.status === 'born' && c.birth_date);
      setChildren(bornKids);
      if (bornKids.length > 0) setSelectedChild(bornKids[0]);
      setLoading(false);
    })();
  }, [userId]);

  // Load vaccination logs for selected child
  const loadVaccinationLogs = useCallback(async (childId: string) => {
    const { data } = await supabase
      .from('baby_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('child_id', childId)
      .eq('log_type', 'vaccination')
      .order('started_at', { ascending: true });

    if (data) {
      setCompletedVaccinations(
        data.map(d => {
          const memo = d.memo ? JSON.parse(d.memo) : {};
          return {
            id: d.id,
            vaccineKey: memo.vaccineKey || '',
            doseIndex: memo.doseIndex ?? 0,
            completedAt: d.started_at,
          };
        })
      );
    }
  }, [userId]);

  useEffect(() => {
    if (selectedChild) loadVaccinationLogs(selectedChild.id);
  }, [selectedChild, loadVaccinationLogs]);

  // Check/uncheck vaccination
  const toggleVaccination = async (vaccineKey: string, doseIndex: number) => {
    if (!selectedChild) return;
    const toggleKey = `${vaccineKey}-${doseIndex}`;
    setTogglingId(toggleKey);

    const existing = completedVaccinations.find(
      v => v.vaccineKey === vaccineKey && v.doseIndex === doseIndex
    );

    if (existing) {
      await supabase.from('baby_logs').delete().eq('id', existing.id);
    } else {
      await supabase.from('baby_logs').insert({
        user_id: userId,
        child_id: selectedChild.id,
        log_type: 'vaccination',
        started_at: new Date().toISOString(),
        memo: JSON.stringify({ vaccineKey, doseIndex }),
      });
    }

    await loadVaccinationLogs(selectedChild.id);
    setTogglingId(null);
  };

  const isCompleted = (vaccineKey: string, doseIndex: number) =>
    completedVaccinations.some(v => v.vaccineKey === vaccineKey && v.doseIndex === doseIndex);

  // Fetch detail from API
  const openDetail = async (key: string, info: VaccinationInfo) => {
    setDetailVaccine({ key, info });
    if (!apiDetails[info.code]) {
      try {
        const res = await fetch(`/api/public-data/vaccination?vcnCd=${info.code}`);
        const data = await res.json();
        setApiDetails(prev => ({ ...prev, [info.code]: data }));
      } catch { /* use static fallback */ }
    }
  };

  // Current age for highlighting
  const childAge = selectedChild?.birth_date ? getAgeMonths(selectedChild.birth_date) : null;

  // Stats
  const totalDoses = Object.values(VACCINATIONS).reduce((sum, v) => sum + v.ageMonths.length, 0);
  const completedCount = completedVaccinations.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-dusty-rose" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Child selector + stats card */}
      {children.length > 0 && selectedChild && (
        <div className="p-4 space-y-3">
          {/* Child selector */}
          {children.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedChild.id === child.id
                      ? 'bg-dusty-rose text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {child.nickname || child.name || '아이'}
                </button>
              ))}
            </div>
          )}

          {/* Status card */}
          <div className="rounded-2xl bg-gradient-to-br from-sage-green/10 to-sage-green/5 border border-sage-green/20 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-green/20">
                <Baby className="h-5 w-5 text-sage-green" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedChild.nickname || selectedChild.name || '우리 아이'} 접종 현황
                </h3>
                <p className="text-xs text-gray-500">
                  생후 {childAge !== null ? `${childAge}개월` : '-'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>접종 완료</span>
                <span>{completedCount} / {totalDoses}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sage-green transition-all duration-500"
                  style={{ width: `${totalDoses > 0 ? (completedCount / totalDoses) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Current month vaccines */}
            {childAge !== null && (() => {
              const current = Object.entries(VACCINATIONS)
                .filter(([, v]) => v.ageMonths.includes(childAge))
                .filter(([key, v]) => {
                  const doseIndex = v.ageMonths.indexOf(childAge);
                  return !isCompleted(key, doseIndex);
                });
              if (current.length === 0) return null;
              return (
                <div className="mt-3 pt-3 border-t border-sage-green/20">
                  <p className="text-xs font-medium text-sage-green mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    이번 달 접종 대상
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {current.map(([key, v]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 rounded-full bg-dusty-rose/10 text-dusty-rose text-xs font-medium"
                      >
                        {v.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* No children message */}
      {children.length === 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center">
            <Syringe className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              자녀를 등록하면 맞춤 접종 현황을<br />확인할 수 있어요
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="px-4 pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-dusty-rose" />
          예방접종 스케줄
        </h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-0">
            {timeline.map((group, gi) => {
              const isCurrent = childAge !== null && group.month === childAge;
              const isPast = childAge !== null && group.month < childAge;

              return (
                <div key={group.month} className="relative">
                  {/* Month marker */}
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        isCurrent
                          ? 'border-dusty-rose bg-dusty-rose text-white'
                          : isPast
                          ? 'border-sage-green bg-sage-green/10 text-sage-green'
                          : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      {group.label}
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-medium text-dusty-rose animate-pulse">
                        ← 현재
                      </span>
                    )}
                  </div>

                  {/* Vaccine cards */}
                  <div className="ml-[48px] mb-4 space-y-2">
                    {group.vaccines.map(({ key, info, doseIndex }) => {
                      const done = selectedChild ? isCompleted(key, doseIndex) : false;
                      const toggleKey = `${key}-${doseIndex}`;
                      const toggling = togglingId === toggleKey;

                      return (
                        <div
                          key={toggleKey}
                          className={`flex items-center gap-2 rounded-xl border p-3 transition-colors ${
                            done
                              ? 'border-sage-green/30 bg-sage-green/5'
                              : isCurrent
                              ? 'border-dusty-rose/30 bg-dusty-rose/5'
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          {/* Check button */}
                          {selectedChild && (
                            <button
                              onClick={() => toggleVaccination(key, doseIndex)}
                              disabled={toggling}
                              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                done
                                  ? 'border-sage-green bg-sage-green text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {toggling ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : done ? (
                                <Check className="h-3 w-3" />
                              ) : null}
                            </button>
                          )}

                          {/* Vaccine info */}
                          <button
                            onClick={() => openDetail(key, info)}
                            className="flex flex-1 items-center justify-between text-left min-w-0"
                          >
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {info.label}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {info.ageMonths.length > 1 ? `${doseIndex + 1}차 · ` : ''}
                                {info.disease}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sheet Detail */}
      {detailVaccine && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDetailVaccine(null)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg rounded-t-2xl bg-white pb-safe animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dusty-rose/10">
                  <Shield className="h-5 w-5 text-dusty-rose" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {detailVaccine.info.label}
                  </h3>
                  <p className="text-sm text-gray-500">{detailVaccine.info.disease}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailVaccine(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                <DetailRow label="대상 질환" value={detailVaccine.info.disease} />
                <DetailRow label="접종 횟수" value={detailVaccine.info.doses} />
                <DetailRow
                  label="접종 시기"
                  value={detailVaccine.info.ageMonths.map(m => m === 0 ? '출생 시' : `${m}개월`).join(', ')}
                />
                <DetailRow label="주의사항" value={detailVaccine.info.caution} />

                {/* API-fetched details */}
                {apiDetails[detailVaccine.info.code]?.description && (
                  <div className="rounded-xl bg-gray-50 p-3 mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">질병관리청 안내</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {apiDetails[detailVaccine.info.code].description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}
