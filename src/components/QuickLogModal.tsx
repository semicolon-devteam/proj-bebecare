'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { addBabyLog, LOG_TYPE_CONFIG, type LogType, type DiaperType } from '@/lib/baby-logs';

interface QuickLogModalProps {
  userId: string;
  childId: string | null;
  logType: LogType;
  onClose: () => void;
  onStartTimer: (type: LogType) => void;
  onSaved?: () => void;
}

export default function QuickLogModal({
  userId,
  childId,
  logType,
  onClose,
  onStartTimer,
  onSaved,
}: QuickLogModalProps) {
  const [amountMl, setAmountMl] = useState('');
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'manual' | 'timer'>('manual');

  const needsAmount = logType === 'formula';
  const needsDuration = logType === 'sleep';
  const needsDiaperType = logType === 'diaper';
  const canTimer = ['sleep', 'breast'].includes(logType);
  const config = LOG_TYPE_CONFIG[logType];

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const started_at = `${dateStr}T${startTime}:00+09:00`;
      const ended_at = endTime ? `${dateStr}T${endTime}:00+09:00` : null;

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
      setToast({ type: 'success', message: `${config.emoji} ${config.label} 기록 완료!` });
      onSaved?.();
      setTimeout(() => onClose(), 1200);
    } catch {
      setToast({ type: 'error', message: '저장에 실패했어요. 다시 시도해주세요.' });
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-slide-up ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <h2 className="text-lg font-bold text-gray-900">{config.label} 기록</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Timer vs Manual toggle for sleep */}
        {canTimer && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 transition-all ${mode === 'manual' ? 'bg-dusty-rose/10 border-dusty-rose text-dusty-rose' : 'bg-gray-50 border-transparent text-gray-400'}`}
            >
              수동 입력
            </button>
            <button
              onClick={() => setMode('timer')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 transition-all ${mode === 'timer' ? 'bg-dusty-rose/10 border-dusty-rose text-dusty-rose' : 'bg-gray-50 border-transparent text-gray-400'}`}
            >
              ⏱ 타이머
            </button>
          </div>
        )}

        {mode === 'timer' && canTimer ? (
          <button
            onClick={() => onStartTimer(logType)}
            className="w-full rounded-xl bg-dusty-rose text-white py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            ⏱ 타이머 시작
          </button>
        ) : (
          <>
            {/* Time */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">시작 시간</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              {needsDuration && (
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">종료 시간</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              )}
            </div>

            {needsAmount && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">용량 (ml)</label>
                <input type="number" placeholder="예: 120" value={amountMl} onChange={e => setAmountMl(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
            )}

            {needsDiaperType && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">종류</label>
                <div className="flex gap-2">
                  {([['wet', '💧 소변'], ['dirty', '💩 대변'], ['mixed', '🔄 혼합']] as [DiaperType, string][]).map(([type, label]) => (
                    <button key={type} onClick={() => setDiaperType(type)} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all ${diaperType === type ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">메모</label>
              <input type="text" placeholder="선택사항" value={memo} onChange={e => setMemo(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-dusty-rose text-white py-3 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}