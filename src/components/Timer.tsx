'use client';

import { useEffect, useState, useCallback } from 'react';
import { addBabyLog, LOG_TYPE_CONFIG, type LogType } from '@/lib/baby-logs';
import { X, Square } from 'lucide-react';
import { IconByName } from '@/lib/icon-map';

interface TimerState {
  active: boolean;
  logType: LogType;
  startedAt: string; // ISO string
  userId: string;
  childId: string | null;
}

const TIMER_KEY = 'bebecare_timer';

function getTimerState(): TimerState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setTimerState(state: TimerState | null) {
  if (typeof window === 'undefined') return;
  if (state) localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  else localStorage.removeItem(TIMER_KEY);
}

export function useTimer() {
  const [timer, setTimer] = useState<TimerState | null>(null);

  useEffect(() => {
    setTimer(getTimerState());
    const handler = () => setTimer(getTimerState());
    window.addEventListener('storage', handler);
    window.addEventListener('timer-update', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('timer-update', handler);
    };
  }, []);

  const startTimer = useCallback((logType: LogType, userId: string, childId: string | null) => {
    const state: TimerState = { active: true, logType, startedAt: new Date().toISOString(), userId, childId };
    setTimerState(state);
    setTimer(state);
    window.dispatchEvent(new Event('timer-update'));
  }, []);

  const stopTimer = useCallback(async (): Promise<boolean> => {
    const state = getTimerState();
    if (!state) return false;
    const ended_at = new Date().toISOString();
    await addBabyLog({
      user_id: state.userId,
      child_id: state.childId,
      log_type: state.logType,
      started_at: state.startedAt,
      ended_at,
      amount_ml: null,
      diaper_type: null,
      memo: null,
    });
    setTimerState(null);
    setTimer(null);
    window.dispatchEvent(new Event('timer-update'));
    return true;
  }, []);

  const cancelTimer = useCallback(() => {
    setTimerState(null);
    setTimer(null);
    window.dispatchEvent(new Event('timer-update'));
  }, []);

  return { timer, startTimer, stopTimer, cancelTimer };
}

export default function TimerBar() {
  const { timer, stopTimer, cancelTimer } = useTimer();
  const [elapsed, setElapsed] = useState('00:00:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!timer) return;
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) return null;

  const config = LOG_TYPE_CONFIG[timer.logType];

  const handleStop = async () => {
    setSaving(true);
    await stopTimer();
    setSaving(false);
  };

  return (
    <div className={`sticky top-0 z-50 flex items-center justify-between px-4 py-2 ${config.bgColor} border-b border-gray-200`}>
      <div className="flex items-center gap-2">
        <IconByName name={config.icon} className={`h-5 w-5 ${config.color}`} />
        <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
        <span className="text-sm font-mono font-bold text-gray-700">{elapsed}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleStop}
          disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-dusty-rose px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Square className="h-3 w-3" aria-hidden="true" />
          {saving ? '저장중...' : '종료'}
        </button>
        <button onClick={cancelTimer} aria-label="타이머 취소" className="p-1 rounded-lg hover:bg-white/50">
          <X className="h-4 w-4 text-gray-500" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
