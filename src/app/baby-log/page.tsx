'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getChildren } from '@/lib/children';
import type { Child } from '@/lib/children';
import {
  getBabyLogs, addBabyLog, deleteBabyLog, computeDailySummary,
  LOG_TYPE_CONFIG,
  type BabyLog, type LogType, type DiaperType, type DailySummary,
} from '@/lib/baby-logs';
import {
  ArrowLeft, Plus, Trash2, ChevronLeft, ChevronRight, X,
} from 'lucide-react';

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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
  if (diff === 0) return `오늘 · ${label}`;
  if (diff === 1) return `어제 · ${label}`;
  return label;
}

export default function BabyLogPage() {
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

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleDelete = async (logId: string) => {
    if (confirm('삭제하시겠어요?')) {
      await deleteBabyLog(logId);
      loadLogs();
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-50">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">📝 육아 기록</h1>
        </div>
      </header>

      {/* Quick log buttons */}
      <div className="px-4 py-3 bg-white border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.entries(LOG_TYPE_CONFIG) as [LogType, typeof LOG_TYPE_CONFIG[LogType]][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => { setDefaultLogType(type); setShowAddModal(true); }}
              className={`flex flex-col items-center gap-1 min-w-[56px] rounded-xl p-2 ${config.bgColor} hover:opacity-80 transition-opacity`}
            >
              <span className="text-xl">{config.emoji}</span>
              <span className={`text-[10px] font-semibold ${config.color}`}>{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      {summary && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-border">
          <div className="flex gap-3 text-xs text-gray-500 overflow-x-auto">
            {summary.totalFormulaMl > 0 && <span>🍼 {summary.totalFormulaMl}ml</span>}
            {summary.totalBabyFoodMl > 0 && <span>🥣 {summary.totalBabyFoodMl}ml</span>}
            {summary.totalBreastCount > 0 && <span>🤱 {summary.totalBreastCount}회</span>}
            {summary.totalSleepMinutes > 0 && (
              <span>😴 {Math.floor(summary.totalSleepMinutes / 60)}시간 {summary.totalSleepMinutes % 60}분</span>
            )}
            {summary.totalDiaperCount > 0 && <span>🧷 {summary.totalDiaperCount}회</span>}
            {summary.bathCount > 0 && <span>🛁 {summary.bathCount}회</span>}
            {summary.medicineCount > 0 && <span>💊 {summary.medicineCount}회</span>}
            {logs.length === 0 && <span className="text-gray-300">기록이 없어요</span>}
          </div>
        </div>
      )}

      {/* Date navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-amber-100">
          <ChevronLeft className="h-5 w-5 text-amber-600" />
        </button>
        <span className="text-sm font-semibold text-amber-800">{formatDateLabel(date)}</span>
        <button onClick={() => changeDate(1)} className="p-1.5 rounded-lg hover:bg-amber-100">
          <ChevronRight className="h-5 w-5 text-amber-600" />
        </button>
      </div>

      {/* Log list */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-sm font-semibold text-gray-600">아직 기록이 없어요</p>
            <p className="text-xs text-gray-400 mt-1">위의 버튼을 눌러 기록을 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const config = LOG_TYPE_CONFIG[log.log_type];
              return (
                <div key={log.id} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 px-4 py-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${config.bgColor}`}>
                    {config.emoji}
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
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-dusty-rose text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-20"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Modal */}
      {showAddModal && userId && (
        <AddLogModal
          userId={userId}
          childId={selectedChildId}
          defaultType={defaultLogType}
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadLogs(); }}
        />
      )}
    </div>
  );
}

function AddLogModal({
  userId,
  childId,
  defaultType,
  onClose,
  onAdded,
}: {
  userId: string;
  childId: string | null;
  defaultType: LogType;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [logType, setLogType] = useState<LogType>(defaultType);
  const [amountMl, setAmountMl] = useState('');
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const needsAmount = ['formula', 'baby_food'].includes(logType);
  const needsDuration = ['sleep', 'breast'].includes(logType);
  const needsDiaperType = logType === 'diaper';

  const handleSave = async () => {
    setSaving(true);
    const today = todayStr();
    const started_at = `${today}T${startTime}:00+09:00`;
    const ended_at = endTime ? `${today}T${endTime}:00+09:00` : null;

    await addBabyLog({
      user_id: userId,
      child_id: childId,
      log_type: logType,
      started_at,
      ended_at,
      amount_ml: needsAmount && amountMl ? parseInt(amountMl) : null,
      diaper_type: needsDiaperType ? diaperType : null,
      memo: memo || null,
    });
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl p-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">기록 추가</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 overflow-x-auto pb-3">
          {(Object.entries(LOG_TYPE_CONFIG) as [LogType, typeof LOG_TYPE_CONFIG[LogType]][]).map(([type, config]) => (
            <button
              key={type}
              onClick={() => setLogType(type)}
              className={`flex flex-col items-center gap-1 min-w-[56px] rounded-xl p-2 border-2 transition-all ${
                logType === type
                  ? `${config.bgColor} border-current ${config.color}`
                  : 'bg-gray-50 border-transparent text-gray-400'
              }`}
            >
              <span className="text-xl">{config.emoji}</span>
              <span className="text-[10px] font-semibold">{config.label}</span>
            </button>
          ))}
        </div>

        {/* Time */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          {needsDuration && (
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">종료 시간</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </div>
          )}
        </div>

        {/* Amount */}
        {needsAmount && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">용량 (ml)</label>
            <input
              type="number"
              placeholder="예: 120"
              value={amountMl}
              onChange={e => setAmountMl(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
        )}

        {/* Diaper type */}
        {needsDiaperType && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">종류</label>
            <div className="flex gap-2">
              {([['wet', '💧 소변'], ['dirty', '💩 대변'], ['mixed', '🔄 혼합']] as [DiaperType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setDiaperType(type)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all ${
                    diaperType === type
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-gray-50 border-transparent text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Memo */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">메모</label>
          <input
            type="text"
            placeholder="선택사항"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-dusty-rose text-white py-3 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
