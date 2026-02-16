'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getChildren, type Child } from '@/lib/children';
import {
  getFetalMeasurements,
  getFetalGrowthStandards,
  compareFetalToPeers,
  type FetalMeasurement,
  type FetalComparisonResult,
} from '@/lib/fetal-measurements';
import {
  ChevronLeft,
  ChevronRight,
  Baby,
  Heart,
  AlertTriangle,
  Stethoscope,
  User,
} from 'lucide-react';

interface PregnancyWeeksTabProps {
  userId: string;
}

interface PregnancyWeekData {
  id: string;
  week: number;
  fruit_emoji: string | null;
  fruit_name: string | null;
  size_cm: number | null;
  weight_g: number | null;
  baby_development: string | null;
  mom_changes: string | null;
  dad_tips: string | null;
  warnings: string | null;
}

function calculatePregnancyWeek(child: Child): { weeks: number; days: number } | null {
  const now = new Date();
  let startDate: Date | null = null;

  if (child.pregnancy_start_date) {
    startDate = new Date(child.pregnancy_start_date);
  } else if (child.due_date) {
    // due_date - 280 days = LMP
    const due = new Date(child.due_date);
    startDate = new Date(due.getTime() - 280 * 24 * 60 * 60 * 1000);
  }

  if (!startDate) return null;

  const diffMs = now.getTime() - startDate.getTime();
  if (diffMs < 0) return { weeks: 0, days: 0 };

  const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

/* ── Circular Progress ── */
function CircularProgress({ week, totalWeeks = 42, emoji }: { week: number; totalWeeks?: number; emoji: string }) {
  const pct = Math.min(week / totalWeeks, 1);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke="#C2728A" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl">{emoji}</span>
      </div>
    </div>
  );
}

/* ── Info Card Section ── */
function InfoSection({ icon: Icon, title, content, color }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`rounded-lg p-1.5 ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

/* ── Main Component ── */
export default function PregnancyWeeksTab({ userId }: PregnancyWeeksTabProps) {
  const [loading, setLoading] = useState(true);
  const [expectingChild, setExpectingChild] = useState<Child | null>(null);
  const [weekData, setWeekData] = useState<PregnancyWeekData[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [currentWeekInfo, setCurrentWeekInfo] = useState<{ weeks: number; days: number } | null>(null);

  // Fetal comparison
  const [fetalResults, setFetalResults] = useState<FetalComparisonResult[]>([]);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        // 1. Get expecting child
        const children = await getChildren(userId);
        const expecting = children.find(c => c.status === 'expecting') || null;
        setExpectingChild(expecting);

        // 2. Calculate current week
        if (expecting) {
          const info = calculatePregnancyWeek(expecting);
          setCurrentWeekInfo(info);
          if (info) {
            setSelectedWeek(Math.max(1, Math.min(42, info.weeks)));
          }
        }

        // 3. Load all pregnancy week data
        const { data, error } = await supabase
          .from('pregnancy_weeks')
          .select('*')
          .order('week', { ascending: true });

        if (!error && data) {
          setWeekData(data as PregnancyWeekData[]);
        }
      } catch (err) {
        console.error('Error loading pregnancy data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // Load fetal comparison for selected week
  useEffect(() => {
    if (!expectingChild) return;
    const loadFetal = async () => {
      try {
        const measurements = await getFetalMeasurements(userId, expectingChild.id);
        const weekMeasurement = measurements.find(m => m.week === selectedWeek);
        if (weekMeasurement) {
          const standards = await getFetalGrowthStandards(selectedWeek);
          const results = compareFetalToPeers(weekMeasurement, standards);
          setFetalResults(results);
        } else {
          setFetalResults([]);
        }
      } catch {
        setFetalResults([]);
      }
    };
    loadFetal();
  }, [userId, expectingChild, selectedWeek]);

  const current = useMemo(
    () => weekData.find(w => w.week === selectedWeek),
    [weekData, selectedWeek]
  );

  const handlePrev = useCallback(() => setSelectedWeek(w => Math.max(1, w - 1)), []);
  const handleNext = useCallback(() => setSelectedWeek(w => Math.min(42, w + 1)), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
      </div>
    );
  }

  // Non-pregnant user
  if (!expectingChild) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Baby className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600 mb-2">임신주수 정보</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          임신 중인 아이가 등록되어 있지 않아요.<br />
          프로필에서 임신 정보를 등록하면<br />
          주차별 맞춤 정보를 확인할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* ── Current Week Progress ── */}
      <div className="flex flex-col items-center gap-2">
        <CircularProgress
          week={selectedWeek}
          emoji={current?.fruit_emoji || '🍇'}
        />
        {currentWeekInfo && selectedWeek === currentWeekInfo.weeks ? (
          <p className="text-lg font-bold text-gray-900">
            {currentWeekInfo.weeks}주 {currentWeekInfo.days}일
          </p>
        ) : (
          <p className="text-lg font-bold text-gray-900">{selectedWeek}주차</p>
        )}
        {current?.fruit_name && (
          <p className="text-sm text-gray-500">
            아기가 <span className="font-semibold text-dusty-rose">{current.fruit_name}</span> 크기예요
          </p>
        )}
      </div>

      {/* ── Week Slider ── */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handlePrev}
          disabled={selectedWeek <= 1}
          className="rounded-full p-2 bg-gray-100 text-gray-600 disabled:opacity-30 active:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 max-w-[200px]">
          {Array.from({ length: 5 }, (_, i) => {
            const w = selectedWeek - 2 + i;
            if (w < 1 || w > 42) return <div key={i} className="w-9 h-9 flex-shrink-0" />;
            const isCurrent = w === selectedWeek;
            const isMyWeek = currentWeekInfo && w === currentWeekInfo.weeks;
            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`w-9 h-9 flex-shrink-0 rounded-full text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-dusty-rose text-white scale-110'
                    : isMyWeek
                    ? 'bg-dusty-rose/20 text-dusty-rose'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {w}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedWeek >= 42}
          className="rounded-full p-2 bg-gray-100 text-gray-600 disabled:opacity-30 active:bg-gray-200 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── Size Info ── */}
      {current && (current.size_cm || current.weight_g) && (
        <div className="flex justify-center gap-6">
          {current.size_cm != null && (
            <div className="text-center">
              <p className="text-2xl font-bold text-sage-green">{current.size_cm}cm</p>
              <p className="text-xs text-gray-400">키</p>
            </div>
          )}
          {current.weight_g != null && (
            <div className="text-center">
              <p className="text-2xl font-bold text-sage-green">
                {current.weight_g >= 1000 ? `${(current.weight_g / 1000).toFixed(1)}kg` : `${current.weight_g}g`}
              </p>
              <p className="text-xs text-gray-400">몸무게</p>
            </div>
          )}
        </div>
      )}

      {/* ── Info Cards ── */}
      {current && (
        <div className="space-y-3">
          {current.baby_development && (
            <InfoSection
              icon={Baby}
              title="아기 발달"
              content={current.baby_development}
              color="bg-dusty-rose"
            />
          )}
          {current.mom_changes && (
            <InfoSection
              icon={Heart}
              title="엄마의 변화"
              content={current.mom_changes}
              color="bg-sage-green"
            />
          )}
          {current.dad_tips && (
            <InfoSection
              icon={User}
              title="아빠 팁"
              content={current.dad_tips}
              color="bg-blue-500"
            />
          )}
          {current.warnings && (
            <InfoSection
              icon={AlertTriangle}
              title="주의사항"
              content={current.warnings}
              color="bg-amber-500"
            />
          )}
        </div>
      )}

      {!current && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">해당 주차의 정보가 없습니다.</p>
        </div>
      )}

      {/* ── Fetal Growth Comparison ── */}
      {fetalResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-dusty-rose" />
            태아 성장 비교
          </h3>
          {fetalResults.map(r => (
            <PercentileBar key={r.metric} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Percentile Bar (inline) ── */
function PercentileBar({ result }: { result: FetalComparisonResult }) {
  const barColor =
    result.status === 'low' ? 'bg-amber-400' :
    result.status === 'high' ? 'bg-blue-400' :
    'bg-green-400';

  const statusColor =
    result.status === 'low' ? 'text-amber-600 bg-amber-50' :
    result.status === 'high' ? 'text-blue-600 bg-blue-50' :
    'text-green-600 bg-green-50';

  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{result.emoji}</span>
          <span className="text-sm font-bold text-gray-800">{result.label}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
          {result.statusLabel}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-bold text-gray-900">{result.value}</span>
        <span className="text-xs text-gray-400">{result.unit}</span>
        <span className="text-xs text-gray-400 ml-auto">평균 {result.p50}{result.unit}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(5, Math.min(95, result.percentile))}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1 text-right">상위 {100 - result.percentile}%</p>
    </div>
  );
}
