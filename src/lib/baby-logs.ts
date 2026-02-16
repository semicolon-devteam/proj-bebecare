import { supabase } from './supabase';

export type LogType = 'formula' | 'baby_food' | 'breast' | 'diaper' | 'sleep' | 'bath' | 'medicine' | 'vaccination';
export type DiaperType = 'wet' | 'dirty' | 'mixed';

export interface BabyLog {
  id: string;
  user_id: string;
  child_id: string | null;
  log_type: LogType;
  started_at: string;
  ended_at: string | null;
  amount_ml: number | null;
  diaper_type: DiaperType | null;
  memo: string | null;
  created_at: string;
}

export const LOG_TYPE_CONFIG: Record<LogType, { emoji: string; label: string; color: string; bgColor: string }> = {
  formula: { emoji: '🍼', label: '분유', color: 'text-orange-500', bgColor: 'bg-orange-100' },
  baby_food: { emoji: '🥣', label: '이유식', color: 'text-green-500', bgColor: 'bg-green-100' },
  breast: { emoji: '🤱', label: '모유', color: 'text-pink-500', bgColor: 'bg-pink-100' },
  diaper: { emoji: '🧷', label: '기저귀', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  sleep: { emoji: '😴', label: '수면', color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  bath: { emoji: '🛁', label: '목욕', color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
  medicine: { emoji: '💊', label: '투약', color: 'text-red-500', bgColor: 'bg-red-100' },
  vaccination: { emoji: '💉', label: '예방접종', color: 'text-teal-500', bgColor: 'bg-teal-100' },
};

export async function getBabyLogs(userId: string, date: string): Promise<BabyLog[]> {
  const startOfDay = `${date}T00:00:00+09:00`;
  const endOfDay = `${date}T23:59:59+09:00`;

  const { data, error } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', startOfDay)
    .lte('started_at', endOfDay)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching baby logs:', error);
    return [];
  }
  return data || [];
}

export async function addBabyLog(log: Omit<BabyLog, 'id' | 'created_at'>): Promise<BabyLog | null> {
  const { data, error } = await supabase
    .from('baby_logs')
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error('Error adding baby log:', error);
    return null;
  }
  return data;
}

export async function deleteBabyLog(logId: string): Promise<boolean> {
  const { error } = await supabase
    .from('baby_logs')
    .delete()
    .eq('id', logId);

  return !error;
}

export async function getBabyLogsRange(userId: string, startDate: string, endDate: string): Promise<BabyLog[]> {
  const startOfDay = `${startDate}T00:00:00+09:00`;
  const endOfDay = `${endDate}T23:59:59+09:00`;

  const { data, error } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', startOfDay)
    .lte('started_at', endOfDay)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching baby logs range:', error);
    return [];
  }
  return data || [];
}

export interface DailySummary {
  totalFormulaMl: number;
  totalBabyFoodMl: number;
  totalBreastCount: number;
  totalSleepMinutes: number;
  totalDiaperCount: number;
  bathCount: number;
  medicineCount: number;
}

export function computeDailySummary(logs: BabyLog[]): DailySummary {
  const summary: DailySummary = {
    totalFormulaMl: 0,
    totalBabyFoodMl: 0,
    totalBreastCount: 0,
    totalSleepMinutes: 0,
    totalDiaperCount: 0,
    bathCount: 0,
    medicineCount: 0,
  };

  for (const log of logs) {
    switch (log.log_type) {
      case 'formula':
        summary.totalFormulaMl += log.amount_ml || 0;
        break;
      case 'baby_food':
        summary.totalBabyFoodMl += log.amount_ml || 0;
        break;
      case 'breast':
        summary.totalBreastCount++;
        break;
      case 'sleep':
        if (log.started_at && log.ended_at) {
          const mins = Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 60000);
          summary.totalSleepMinutes += mins;
        }
        break;
      case 'diaper':
        summary.totalDiaperCount++;
        break;
      case 'bath':
        summary.bathCount++;
        break;
      case 'medicine':
        summary.medicineCount++;
        break;
    }
  }

  return summary;
}
