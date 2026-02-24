'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getChildren } from '@/lib/children';
import type { Child } from '@/lib/children';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  getBabyLogs, getBabyLogsRange, addBabyLog, deleteBabyLog, computeDailySummary,
  LOG_TYPE_CONFIG,
  type BabyLog, type LogType, type DiaperType, type DailySummary,
} from '@/lib/baby-logs';
import { useTimer } from '@/components/Timer';
import QuickLogModal from '@/components/QuickLogModal';
import VoiceInput from '@/components/VoiceInput';
import PeerComparison from '@/components/PeerComparison';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, X, BarChart3, ClipboardList, Users,
  Baby as BabyIcon, Moon as MoonIcon, Shirt as ShirtIcon, Heart as HeartIcon,
  Bath as BathIcon, Pill as PillIcon, Syringe as SyringeIcon, UtensilsCrossed,
} from 'lucide-react';
import { IconByName } from '@/lib/icon-map';
import EmptyStateIllustration from '@/components/illustrations/EmptyStateIllustration';
import { FadeInUp, StaggerContainer, StaggerItem, CuteLoader } from '@/components/animations/MotionWrappers';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h >= 12 ? 'PM' : 'AM'} ${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m}`;
}

function formatDuration(startStr: string, endStr: string): string {
  const mins = Math.round((new Date(endStr).getTime() - new Date(startStr).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(ds: string): string {
  const d = new Date(ds + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
  if (diff === 0) return `오늘 · ${label}`;
  if (diff === 1) return `어제 · ${label}`;
  return label;
}

type SubTab = 'logs' | 'stats' | 'peers';

export default function LogPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [logs, setLogs] = useState<BabyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [defaultLogType, setDefaultLogType] = useState<LogType>('formula');
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('logs');
  const { startTimer } = useTimer();

  useEffect(() => {
    async function init() {
      const user = await getCurrentUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const kids = await getChildren(user.id);
      setChildren(kids.filter(k => k.status === 'born'));
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    }
    init();
  }, [router]);

  const loadLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await getBabyLogs(userId, date);
    setLogs(data);
    setSummary(computeDailySummary(data));
    setLoading(false);
  }, [userId, date]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Listen for timer updates to refresh logs
  useEffect(() => {
    const handler = () => loadLogs();
    window.addEventListener('timer-update', handler);
    return () => window.removeEventListener('timer-update', handler);
  }, [loadLogs]);

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(dateStr(d));
  };

  const handleDelete = async (logId: string) => {
    if (confirm('삭제하시겠어요?')) {
      await deleteBabyLog(logId);
      loadLogs();
    }
  };

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <CuteLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
            기록
          </h1>
        </div>
      </header>

      {/* Sub tabs: 기록 | 통계 */}
      <div className="border-b border-border bg-white px-4">
        <div className="flex">
          <button
            onClick={() => setSubTab('logs')}
            className={`flex items-center gap-1.5 flex-1 py-3 justify-center text-sm font-semibold transition-colors border-b-2 ${
              subTab === 'logs' ? 'border-dusty-rose text-dusty-rose' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            기록
          </button>
          <button
            onClick={() => setSubTab('stats')}
            className={`flex items-center gap-1.5 flex-1 py-3 justify-center text-sm font-semibold transition-colors border-b-2 ${
              subTab === 'stats' ? 'border-dusty-rose text-dusty-rose' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            통계
          </button>
          <button
            onClick={() => setSubTab('peers')}
            className={`flex items-center gap-1.5 flex-1 py-3 justify-center text-sm font-semibold transition-colors border-b-2 ${
              subTab === 'peers' ? 'border-dusty-rose text-dusty-rose' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            또래비교
          </button>
        </div>
      </div>

      {subTab === 'logs' ? (
        <>
          {/* Quick log buttons */}
          <div className="px-4 py-3 bg-white border-b border-border">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(Object.entries(LOG_TYPE_CONFIG) as [LogType, typeof LOG_TYPE_CONFIG[LogType]][]).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => { setDefaultLogType(type); setShowAddModal(true); }}
                  className={`flex flex-col items-center gap-1 min-w-[56px] rounded-[1.25rem] p-2 ${config.bgColor} hover:opacity-80 transition-opacity`}
                >
                  <div className="h-8 w-8 rounded-full bg-white/60 flex items-center justify-center">
                    <IconByName name={config.icon} className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary bar */}
          {summary && (
            <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
              <div className="flex gap-3 text-xs text-gray-500 overflow-x-auto items-center">
                {summary.totalFormulaMl > 0 && <span className="flex items-center gap-1"><BabyIcon className="h-3 w-3 text-orange-400" aria-hidden="true" />{summary.totalFormulaMl}ml</span>}
                {summary.totalBabyFoodMl > 0 && <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3 text-green-400" aria-hidden="true" />{summary.totalBabyFoodMl}ml</span>}
                {summary.totalBreastCount > 0 && <span className="flex items-center gap-1"><HeartIcon className="h-3 w-3 text-pink-400" aria-hidden="true" />{summary.totalBreastCount}회</span>}
                {summary.totalSleepMinutes > 0 && (
                  <span className="flex items-center gap-1"><MoonIcon className="h-3 w-3 text-indigo-400" aria-hidden="true" />{Math.floor(summary.totalSleepMinutes / 60)}시간 {summary.totalSleepMinutes % 60}분</span>
                )}
                {summary.totalDiaperCount > 0 && <span className="flex items-center gap-1"><ShirtIcon className="h-3 w-3 text-amber-500" aria-hidden="true" />{summary.totalDiaperCount}회</span>}
                {summary.bathCount > 0 && <span className="flex items-center gap-1"><BathIcon className="h-3 w-3 text-cyan-400" aria-hidden="true" />{summary.bathCount}회</span>}
                {summary.medicineCount > 0 && <span className="flex items-center gap-1"><PillIcon className="h-3 w-3 text-red-400" aria-hidden="true" />{summary.medicineCount}회</span>}
                {logs.length === 0 && <span className="text-gray-300">기록이 없어요</span>}
              </div>
            </div>
          )}

          {/* Date navigation */}
          <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
            <button onClick={() => changeDate(-1)} aria-label="이전 날짜" className="p-1.5 rounded-lg hover:bg-amber-100">
              <ChevronLeft className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </button>
            <span className="text-sm font-semibold text-amber-800">{formatDateLabel(date)}</span>
            <button onClick={() => changeDate(1)} aria-label="다음 날짜" className="p-1.5 rounded-lg hover:bg-amber-100">
              <ChevronRight className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </button>
          </div>

          {/* Log list */}
          <div className="px-4 py-3 pb-24">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="" />
              </div>
            ) : logs.length === 0 ? (
              <FadeInUp>
                <div className="text-center py-12">
                  <div className="flex justify-center mb-3">
                    <EmptyStateIllustration type="no-records" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600">아직 기록이 없어요</p>
                  <p className="text-xs text-gray-400 mt-1">위의 버튼을 눌러 기록을 시작하세요</p>
                </div>
              </FadeInUp>
            ) : (
              <StaggerContainer className="space-y-2">
                {logs.map(log => {
                  const config = LOG_TYPE_CONFIG[log.log_type];
                  return (
                    <StaggerItem key={log.id}>
                    <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                        <IconByName name={config.icon} className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                          {log.amount_ml && <span className="text-xs text-gray-500">{log.amount_ml}ml</span>}
                          {log.diaper_type && (
                            <span className="text-xs text-gray-400">
                              {log.diaper_type === 'wet' ? '소변' : log.diaper_type === 'dirty' ? '대변' : '혼합'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatTime(log.started_at)}
                          {log.ended_at && (
                            <span> ~ {formatTime(log.ended_at)} ({formatDuration(log.started_at, log.ended_at)})</span>
                          )}
                        </div>
                        {log.memo && <p className="text-xs text-gray-500 mt-1">{log.memo}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(log.id)}
                        aria-label="기록 삭제"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}
          </div>

          {/* Voice Input FAB (left) */}
          <VoiceInput userId={userId} childId={selectedChildId} onLogSaved={loadLogs} />

          {/* Manual Add FAB (right) */}
          <button
            onClick={() => setShowAddModal(true)}
            aria-label="기록 추가"
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full bg-dusty-rose text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-20"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Quick Log Modal */}
          {showAddModal && userId && (
            <QuickLogModal
              userId={userId}
              childId={selectedChildId}
              logType={defaultLogType}
              onClose={() => setShowAddModal(false)}
              onStartTimer={(type) => { startTimer(type, userId, selectedChildId); setShowAddModal(false); }}
            />
          )}
        </>
      ) : subTab === 'stats' ? (
        /* Stats Tab */
        userId && <StatsTab userId={userId} />
      ) : (
        /* Peers Tab */
        userId && (
          <div className="px-4 py-4 pb-24">
            <PeerComparison userId={userId} />
          </div>
        )
      )}
    </div>
  );
}

/* ========== Stats Tab ========== */
function StatsTab({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<7 | 30 | 90>(7);
  const [allLogs, setAllLogs] = useState<BabyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - period);
      const data = await getBabyLogsRange(userId, dateStr(start), dateStr(end));
      setAllLogs(data);
      setLoading(false);
    }
    load();
  }, [userId, period]);

  const { feedingData, sleepData, diaperData, avgSummary } = useMemo(() => {
    const dayMap: Record<string, BabyLog[]> = {};
    const end = new Date();
    for (let i = 0; i < period; i++) {
      const d = new Date();
      d.setDate(end.getDate() - i);
      dayMap[dateStr(d)] = [];
    }
    for (const log of allLogs) {
      const day = dateStr(new Date(log.started_at));
      if (dayMap[day]) dayMap[day].push(log);
    }

    const days = Object.keys(dayMap).sort();
    let totalFeedMl = 0, totalSleepMin = 0, totalDiaper = 0, activeDays = 0;

    const feedingData = days.map(day => {
      const ml = dayMap[day].filter(l => ['formula', 'baby_food'].includes(l.log_type)).reduce((s, l) => s + (l.amount_ml || 0), 0);
      totalFeedMl += ml;
      return { date: day.slice(5), ml };
    });

    const sleepData = days.map(day => {
      const mins = dayMap[day].filter(l => l.log_type === 'sleep' && l.ended_at).reduce((s, l) => {
        return s + Math.round((new Date(l.ended_at!).getTime() - new Date(l.started_at).getTime()) / 60000);
      }, 0);
      totalSleepMin += mins;
      return { date: day.slice(5), hours: Math.round(mins / 6) / 10 };
    });

    const diaperData = days.map(day => {
      const count = dayMap[day].filter(l => l.log_type === 'diaper').length;
      totalDiaper += count;
      if (dayMap[day].length > 0) activeDays++;
      return { date: day.slice(5), count };
    });

    const daysCount = activeDays || 1;
    const avgSummary = {
      avgFeedMl: Math.round(totalFeedMl / daysCount),
      avgSleepHours: Math.round(totalSleepMin / daysCount / 6) / 10,
      avgDiaper: Math.round(totalDiaper / daysCount * 10) / 10,
    };

    return { feedingData, sleepData, diaperData, avgSummary };
  }, [allLogs, period]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="" />
      </div>
    );
  }

  if (allLogs.length === 0) {
    return (
      <FadeInUp>
        <div className="text-center py-12 px-4">
          <div className="flex justify-center mb-3">
            <EmptyStateIllustration type="no-stats" />
          </div>
          <p className="text-sm font-semibold text-gray-600">기록을 시작하면 통계를 볼 수 있어요</p>
          <p className="text-xs text-gray-400 mt-1">수유, 수면, 기저귀 등의 기록을 추가해보세요</p>
        </div>
      </FadeInUp>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5 pb-24">
      {/* Period selector */}
      <div className="flex gap-2">
        {([7, 30, 90] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 transition-all ${
              period === p ? 'bg-dusty-rose/10 border-dusty-rose text-dusty-rose' : 'bg-gray-50 border-transparent text-gray-400'
            }`}
          >
            최근 {p}일
          </button>
        ))}
      </div>

      {/* Average summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-orange-50 p-3 text-center">
          <p className="text-lg font-bold text-orange-600">{avgSummary.avgFeedMl}ml</p>
          <p className="text-[10px] font-semibold text-orange-400">일평균 수유량</p>
        </div>
        <div className="rounded-xl bg-indigo-50 p-3 text-center">
          <p className="text-lg font-bold text-indigo-600">{avgSummary.avgSleepHours}h</p>
          <p className="text-[10px] font-semibold text-indigo-400">일평균 수면</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{avgSummary.avgDiaper}회</p>
          <p className="text-[10px] font-semibold text-amber-400">일평균 기저귀</p>
        </div>
      </div>

      {/* Feeding chart */}
      <div className="rounded-xl bg-white border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><BabyIcon className="h-4 w-4 text-orange-400" aria-hidden="true" /> 수유량 추이 (ml)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={feedingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="ml" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep chart */}
      <div className="rounded-xl bg-white border border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><MoonIcon className="h-4 w-4 text-indigo-400" aria-hidden="true" /> 수면 시간 추이 (시간)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={sleepData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Diaper chart */}
      <div className="rounded-xl bg-white border border-gray-100 p-4 mb-8">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><ShirtIcon className="h-4 w-4 text-amber-500" aria-hidden="true" /> 기저귀 교체 횟수</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={diaperData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}