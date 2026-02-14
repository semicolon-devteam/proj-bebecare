import type { LogType, DiaperType } from './baby-logs';

export interface VoiceParsedLog {
  log_type: LogType;
  amount_ml: number | null;
  diaper_type: DiaperType | null;
  memo: string | null;
  started_at_offset_minutes: number;
  duration_minutes: number | null;
}

export interface VoiceParseResult {
  success: boolean;
  logs: VoiceParsedLog[];
  confirmation: string | null;
  error?: string;
}

export async function parseVoiceInput(text: string): Promise<VoiceParseResult> {
  const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const res = await fetch('/api/voice-parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, currentTime }),
  });

  if (!res.ok) {
    return { success: false, logs: [], confirmation: null, error: '서버 오류' };
  }

  return res.json();
}

/**
 * Convert parsed voice log to addBabyLog parameters
 */
export function voiceLogToRecord(
  parsed: VoiceParsedLog,
  userId: string,
  childId: string | null
) {
  const now = new Date();
  const started = new Date(now.getTime() + parsed.started_at_offset_minutes * 60000);
  const startedAt = started.toISOString();

  let endedAt: string | null = null;
  if (parsed.duration_minutes) {
    endedAt = new Date(started.getTime() + parsed.duration_minutes * 60000).toISOString();
  }

  return {
    user_id: userId,
    child_id: childId,
    log_type: parsed.log_type,
    started_at: startedAt,
    ended_at: endedAt,
    amount_ml: parsed.amount_ml,
    diaper_type: parsed.diaper_type,
    memo: parsed.memo,
  };
}
