import { supabase } from './supabase';
import type { BabyLog } from './baby-logs';

export interface PeerNorm {
  metric: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  source: string | null;
}

export interface ComparisonResult {
  metric: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  p50: number;
  percentile: number; // 0-100 estimated percentile
  status: 'low' | 'normal' | 'high';
  statusLabel: string;
  norm: PeerNorm | null;
}

/**
 * Get peer norms for a given age in months
 */
export async function getPeerNorms(ageMonths: number): Promise<PeerNorm[]> {
  const { data, error } = await supabase
    .from('peer_norms')
    .select('metric, p10, p25, p50, p75, p90, source')
    .lte('age_month_start', ageMonths)
    .gte('age_month_end', ageMonths);

  if (error) {
    console.error('Error fetching peer norms:', error);
    return [];
  }
  return data || [];
}

/**
 * Estimate percentile from value and norm distribution
 */
function estimatePercentile(value: number, norm: PeerNorm): number {
  if (value <= norm.p10) return Math.max(5, Math.round((value / norm.p10) * 10));
  if (value <= norm.p25) return 10 + Math.round(((value - norm.p10) / (norm.p25 - norm.p10)) * 15);
  if (value <= norm.p50) return 25 + Math.round(((value - norm.p25) / (norm.p50 - norm.p25)) * 25);
  if (value <= norm.p75) return 50 + Math.round(((value - norm.p50) / (norm.p75 - norm.p50)) * 25);
  if (value <= norm.p90) return 75 + Math.round(((value - norm.p75) / (norm.p90 - norm.p75)) * 15);
  return Math.min(95, 90 + Math.round(((value - norm.p90) / (norm.p90 * 0.2)) * 5));
}

function getStatus(percentile: number): { status: 'low' | 'normal' | 'high'; statusLabel: string } {
  if (percentile < 25) return { status: 'low', statusLabel: '또래보다 적어요' };
  if (percentile > 75) return { status: 'high', statusLabel: '또래보다 많아요' };
  return { status: 'normal', statusLabel: '또래와 비슷해요' };
}

/**
 * Compare daily logs against peer norms
 */
export function compareToPeers(logs: BabyLog[], norms: PeerNorm[]): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  const normMap = new Map(norms.map(n => [n.metric, n]));

  // Daily formula ml
  const formulaNorm = normMap.get('daily_formula_ml');
  const formulaMl = logs
    .filter(l => l.log_type === 'formula')
    .reduce((sum, l) => sum + (l.amount_ml || 0), 0);
  if (formulaNorm) {
    const pct = estimatePercentile(formulaMl, formulaNorm);
    const { status, statusLabel } = getStatus(pct);
    results.push({
      metric: 'daily_formula_ml',
      label: '분유 섭취량',
      icon: 'Baby',
      value: formulaMl,
      unit: 'ml',
      p50: formulaNorm.p50,
      percentile: pct,
      status,
      statusLabel,
      norm: formulaNorm,
    });
  }

  // Daily breast count
  const breastNorm = normMap.get('daily_breast_count');
  const breastCount = logs.filter(l => l.log_type === 'breast').length;
  if (breastNorm) {
    const pct = estimatePercentile(breastCount, breastNorm);
    const { status, statusLabel } = getStatus(pct);
    results.push({
      metric: 'daily_breast_count',
      label: '모유수유 횟수',
      icon: 'Heart',
      value: breastCount,
      unit: '회',
      p50: breastNorm.p50,
      percentile: pct,
      status,
      statusLabel,
      norm: breastNorm,
    });
  }

  // Daily baby food ml
  const babyFoodNorm = normMap.get('daily_baby_food_ml');
  const babyFoodMl = logs
    .filter(l => l.log_type === 'baby_food')
    .reduce((sum, l) => sum + (l.amount_ml || 0), 0);
  if (babyFoodNorm) {
    const pct = estimatePercentile(babyFoodMl, babyFoodNorm);
    const { status, statusLabel } = getStatus(pct);
    results.push({
      metric: 'daily_baby_food_ml',
      label: '이유식 섭취량',
      icon: 'UtensilsCrossed',
      value: babyFoodMl,
      unit: 'ml',
      p50: babyFoodNorm.p50,
      percentile: pct,
      status,
      statusLabel,
      norm: babyFoodNorm,
    });
  }

  // Daily sleep hours
  const sleepNorm = normMap.get('daily_sleep_hours');
  const sleepMinutes = logs
    .filter(l => l.log_type === 'sleep' && l.ended_at)
    .reduce((sum, l) => sum + Math.round((new Date(l.ended_at!).getTime() - new Date(l.started_at).getTime()) / 60000), 0);
  const sleepHours = Math.round(sleepMinutes / 6) / 10;
  if (sleepNorm) {
    const pct = estimatePercentile(sleepHours, sleepNorm);
    const { status, statusLabel } = getStatus(pct);
    results.push({
      metric: 'daily_sleep_hours',
      label: '수면 시간',
      icon: 'Moon',
      value: sleepHours,
      unit: '시간',
      p50: sleepNorm.p50,
      percentile: pct,
      status,
      statusLabel,
      norm: sleepNorm,
    });
  }

  // Daily diaper count
  const diaperNorm = normMap.get('daily_diaper_count');
  const diaperCount = logs.filter(l => l.log_type === 'diaper').length;
  if (diaperNorm) {
    const pct = estimatePercentile(diaperCount, diaperNorm);
    const { status, statusLabel } = getStatus(pct);
    results.push({
      metric: 'daily_diaper_count',
      label: '기저귀 교체',
      icon: 'Shirt',
      value: diaperCount,
      unit: '회',
      p50: diaperNorm.p50,
      percentile: pct,
      status,
      statusLabel,
      norm: diaperNorm,
    });
  }

  return results;
}

/**
 * Calculate age in months from birth date
 */
export function getAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

/**
 * Calculate pregnancy weeks from pregnancy start date
 */
export function getAgeWeeks(pregnancyStartDate: string): number {
  const start = new Date(pregnancyStartDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}
