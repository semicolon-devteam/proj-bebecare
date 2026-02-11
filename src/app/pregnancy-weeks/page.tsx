'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { ArrowLeft, Baby, Heart, User, Lightbulb, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface PregnancyWeek {
  id: string;
  week: number;
  trimester: number;
  baby_size_fruit: string | null;
  baby_size_cm: number | null;
  baby_weight_g: number | null;
  baby_development: string;
  mom_changes: string;
  dad_tips: string;
  tips: string | null;
  warnings: string | null;
}

const trimesterLabel: Record<number, string> = {
  1: '임신 초기 (1분기)',
  2: '임신 중기 (2분기)',
  3: '임신 후기 (3분기)',
};

const trimesterColor: Record<number, { bg: string; text: string; border: string; dot: string }> = {
  1: { bg: 'bg-pink-50', text: 'text-dusty-rose', border: 'border-pink-200', dot: 'bg-dusty-rose' },
  2: { bg: 'bg-green-50', text: 'text-sage', border: 'border-green-200', dot: 'bg-sage' },
  3: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-600' },
};

export default function PregnancyWeeksPage() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<PregnancyWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get user's current pregnancy week
      const { data: profile } = await supabase
        .from('profiles')
        .select('due_date, stage')
        .eq('user_id', user.id)
        .single();

      if (profile?.stage === 'pregnant' && profile.due_date) {
        const dueDate = new Date(profile.due_date);
        const startDate = new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
        const days = Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.max(1, Math.min(42, Math.floor(days / 7)));
        setCurrentWeek(week);
        setExpandedWeek(week);
      }

      // Also check children for expecting status
      const { data: children } = await supabase
        .from('children')
        .select('pregnancy_start_date, status, due_date')
        .eq('user_id', user.id)
        .eq('status', 'expecting')
        .limit(1);

      if (children && children.length > 0) {
        const child = children[0];
        if (child.pregnancy_start_date) {
          const start = new Date(child.pregnancy_start_date);
          const days = Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000));
          const week = Math.max(1, Math.min(42, Math.floor(days / 7)));
          setCurrentWeek(week);
          setExpandedWeek(week);
        }
      }

      // Fetch all pregnancy weeks
      const { data: weeksData } = await supabase
        .from('pregnancy_weeks')
        .select('*')
        .order('week', { ascending: true });

      setWeeks(weeksData || []);
      setLoading(false);
    }
    load();
  }, [router]);

  // Scroll to current week on load
  useEffect(() => {
    if (!loading && currentWeek) {
      const el = document.getElementById(`week-${currentWeek}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    }
  }, [loading, currentWeek]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
      </div>
    );
  }

  // Group by trimester
  const byTrimester = weeks.reduce<Record<number, PregnancyWeek[]>>((acc, w) => {
    const t = w.trimester;
    if (!acc[t]) acc[t] = [];
    acc[t].push(w);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">주수별 태아 성장</h1>
            {currentWeek && (
              <p className="text-xs text-dusty-rose font-semibold">현재 {currentWeek}주차</p>
            )}
          </div>
        </div>
      </header>

      {/* Current week highlight */}
      {currentWeek && weeks.find(w => w.week === currentWeek) && (
        <div className="mx-4 mt-4 mb-2">
          <CurrentWeekCard week={weeks.find(w => w.week === currentWeek)!} />
        </div>
      )}

      {/* All weeks by trimester */}
      <div className="px-4 pb-8">
        {[1, 2, 3].map((trimester) => (
          <div key={trimester} className="mt-6">
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl ${trimesterColor[trimester].bg}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${trimesterColor[trimester].dot}`} />
              <h2 className={`text-sm font-bold ${trimesterColor[trimester].text}`}>
                {trimesterLabel[trimester]}
              </h2>
              <span className="text-xs text-gray-400 ml-auto">
                {trimester === 1 ? '1~13주' : trimester === 2 ? '14~27주' : '28~42주'}
              </span>
            </div>
            <div className="space-y-2">
              {(byTrimester[trimester] || []).map((w) => (
                <WeekRow
                  key={w.week}
                  week={w}
                  isCurrentWeek={w.week === currentWeek}
                  isExpanded={expandedWeek === w.week}
                  onToggle={() => setExpandedWeek(expandedWeek === w.week ? null : w.week)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrentWeekCard({ week }: { week: PregnancyWeek }) {
  const colors = trimesterColor[week.trimester];
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-5`}>
      <div className="text-center mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">현재 주차</p>
        <p className={`text-3xl font-bold ${colors.text} mt-1`}>{week.week}주</p>
        {week.baby_size_fruit && (
          <p className="text-sm text-gray-600 mt-1">
            아기 크기: <span className="font-semibold">{week.baby_size_fruit}</span>
            {week.baby_size_cm && <span className="text-gray-400"> ({week.baby_size_cm}cm</span>}
            {week.baby_weight_g && <span className="text-gray-400">, {week.baby_weight_g}g)</span>}
            {week.baby_size_cm && !week.baby_weight_g && <span className="text-gray-400">)</span>}
          </p>
        )}
      </div>
      <div className="space-y-3">
        <InfoBlock icon={<Baby className="h-4 w-4 text-dusty-rose" />} title="아기 발달" text={week.baby_development} />
        <InfoBlock icon={<Heart className="h-4 w-4 text-red-500" />} title="엄마 변화" text={week.mom_changes} />
        <InfoBlock icon={<User className="h-4 w-4 text-blue-500" />} title="아빠 할 일" text={week.dad_tips} />
        {week.tips && <InfoBlock icon={<Lightbulb className="h-4 w-4 text-amber-500" />} title="팁" text={week.tips} />}
        {week.warnings && <InfoBlock icon={<AlertTriangle className="h-4 w-4 text-red-600" />} title="주의" text={week.warnings} />}
      </div>
    </div>
  );
}

function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white/70 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-bold text-gray-600">{title}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}

function WeekRow({
  week,
  isCurrentWeek,
  isExpanded,
  onToggle,
}: {
  week: PregnancyWeek;
  isCurrentWeek: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = trimesterColor[week.trimester];

  return (
    <div
      id={`week-${week.week}`}
      className={`card overflow-hidden transition-all ${
        isCurrentWeek ? `ring-2 ring-dusty-rose ${colors.bg}` : ''
      }`}
    >
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center gap-3 text-left">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${colors.dot}`}>
          {week.week}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{week.week}주차</span>
            {isCurrentWeek && (
              <span className="text-[10px] font-bold bg-dusty-rose text-white px-1.5 py-0.5 rounded-full">NOW</span>
            )}
            {week.baby_size_fruit && (
              <span className="text-xs text-gray-400">{week.baby_size_fruit}</span>
            )}
          </div>
          {!isExpanded && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {week.baby_development.slice(0, 60)}...
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {week.baby_size_cm && (
            <span className="text-[10px] text-gray-400">{week.baby_size_cm}cm</span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2.5">
          {week.baby_weight_g && (
            <div className="flex gap-4 text-xs text-gray-500">
              {week.baby_size_cm && <span>📏 {week.baby_size_cm}cm</span>}
              <span>⚖️ {week.baby_weight_g}g</span>
            </div>
          )}
          <InfoBlock icon={<Baby className="h-4 w-4 text-dusty-rose" />} title="아기 발달" text={week.baby_development} />
          <InfoBlock icon={<Heart className="h-4 w-4 text-red-500" />} title="엄마 변화" text={week.mom_changes} />
          <InfoBlock icon={<User className="h-4 w-4 text-blue-500" />} title="아빠 할 일" text={week.dad_tips} />
          {week.tips && <InfoBlock icon={<Lightbulb className="h-4 w-4 text-amber-500" />} title="팁" text={week.tips} />}
          {week.warnings && <InfoBlock icon={<AlertTriangle className="h-4 w-4 text-red-600" />} title="⚠️ 주의" text={week.warnings} />}
        </div>
      )}
    </div>
  );
}
