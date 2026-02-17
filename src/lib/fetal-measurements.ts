import { supabase } from './supabase';

export interface FetalMeasurement {
  id: string;
  user_id: string;
  child_id: string | null;
  measured_at: string;
  week: number;
  bpd_mm: number | null;
  fl_mm: number | null;
  ac_mm: number | null;
  hc_mm: number | null;
  efw_g: number | null;
  heart_rate_bpm: number | null;
  memo: string | null;
  created_at: string;
}

export interface FetalMeasurementInput {
  child_id?: string | null;
  measured_at?: string;
  week: number;
  bpd_mm?: number | null;
  fl_mm?: number | null;
  ac_mm?: number | null;
  hc_mm?: number | null;
  efw_g?: number | null;
  heart_rate_bpm?: number | null;
  memo?: string | null;
}

export interface FetalGrowthStandard {
  week: number;
  metric: string;
  p3: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p97: number;
  source: string | null;
}

export interface FetalComparisonResult {
  metric: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  p50: number;
  percentile: number;
  status: 'low' | 'normal' | 'high';
  statusLabel: string;
  norm: FetalGrowthStandard | null;
}

const METRIC_INFO: Record<string, { label: string; icon: string; unit: string }> = {
  bpd_mm: { label: '머리 직경 (BPD)', icon: 'Circle', unit: 'mm' },
  fl_mm: { label: '대퇴골 길이 (FL)', icon: 'Bone', unit: 'mm' },
  ac_mm: { label: '복부 둘레 (AC)', icon: 'Circle', unit: 'mm' },
  hc_mm: { label: '머리 둘레 (HC)', icon: 'Ruler', unit: 'mm' },
  efw_g: { label: '예측 체중 (EFW)', icon: 'Scale', unit: 'g' },
  heart_rate_bpm: { label: '심박수', icon: 'Heart', unit: 'bpm' },
};

/**
 * 태아 측정값 추가
 */
export async function addFetalMeasurement(
  userId: string,
  input: FetalMeasurementInput
): Promise<FetalMeasurement | null> {
  const { data, error } = await supabase
    .from('fetal_measurements')
    .insert({
      user_id: userId,
      child_id: input.child_id || null,
      measured_at: input.measured_at || new Date().toISOString().split('T')[0],
      week: input.week,
      bpd_mm: input.bpd_mm ?? null,
      fl_mm: input.fl_mm ?? null,
      ac_mm: input.ac_mm ?? null,
      hc_mm: input.hc_mm ?? null,
      efw_g: input.efw_g ?? null,
      heart_rate_bpm: input.heart_rate_bpm ?? null,
      memo: input.memo ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding fetal measurement:', error);
    return null;
  }
  return data as FetalMeasurement;
}

/**
 * 태아 측정값 목록 조회
 */
export async function getFetalMeasurements(
  userId: string,
  childId?: string
): Promise<FetalMeasurement[]> {
  let query = supabase
    .from('fetal_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false });

  if (childId) {
    query = query.eq('child_id', childId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching fetal measurements:', error);
    return [];
  }
  return (data || []) as FetalMeasurement[];
}

/**
 * 태아 측정값 삭제
 */
export async function deleteFetalMeasurement(id: string): Promise<boolean> {
  const { error } = await supabase.from('fetal_measurements').delete().eq('id', id);
  if (error) {
    console.error('Error deleting fetal measurement:', error);
    return false;
  }
  return true;
}

/**
 * 특정 주차의 성장 기준 데이터 조회
 */
export async function getFetalGrowthStandards(week: number): Promise<FetalGrowthStandard[]> {
  const { data, error } = await supabase
    .from('fetal_growth_standards')
    .select('*')
    .eq('week', week);

  if (error) {
    console.error('Error fetching fetal growth standards:', error);
    return [];
  }
  return (data || []) as FetalGrowthStandard[];
}

/**
 * p3~p97 범위에서 백분위 추정
 */
function estimateFetalPercentile(value: number, std: FetalGrowthStandard): number {
  if (value <= std.p3) return Math.max(1, Math.round((value / std.p3) * 3));
  if (value <= std.p10) return 3 + Math.round(((value - std.p3) / (std.p10 - std.p3)) * 7);
  if (value <= std.p25) return 10 + Math.round(((value - std.p10) / (std.p25 - std.p10)) * 15);
  if (value <= std.p50) return 25 + Math.round(((value - std.p25) / (std.p50 - std.p25)) * 25);
  if (value <= std.p75) return 50 + Math.round(((value - std.p50) / (std.p75 - std.p50)) * 25);
  if (value <= std.p90) return 75 + Math.round(((value - std.p75) / (std.p90 - std.p75)) * 15);
  if (value <= std.p97) return 90 + Math.round(((value - std.p90) / (std.p97 - std.p90)) * 7);
  return Math.min(99, 97 + Math.round(((value - std.p97) / (std.p97 * 0.05)) * 2));
}

function getFetalStatus(percentile: number): { status: 'low' | 'normal' | 'high'; statusLabel: string } {
  if (percentile < 10) return { status: 'low', statusLabel: '또래보다 작아요' };
  if (percentile > 90) return { status: 'high', statusLabel: '또래보다 커요' };
  if (percentile < 25) return { status: 'low', statusLabel: '조금 작은 편' };
  if (percentile > 75) return { status: 'high', statusLabel: '조금 큰 편' };
  return { status: 'normal', statusLabel: '또래와 비슷해요' };
}

/**
 * 태아 측정값과 기준 데이터 비교
 */
export function compareFetalToPeers(
  measurement: FetalMeasurement,
  standards: FetalGrowthStandard[]
): FetalComparisonResult[] {
  const results: FetalComparisonResult[] = [];
  const stdMap = new Map(standards.map(s => [s.metric, s]));

  const metrics: { key: keyof FetalMeasurement; metric: string }[] = [
    { key: 'efw_g', metric: 'efw_g' },
    { key: 'bpd_mm', metric: 'bpd_mm' },
    { key: 'hc_mm', metric: 'hc_mm' },
    { key: 'ac_mm', metric: 'ac_mm' },
    { key: 'fl_mm', metric: 'fl_mm' },
    { key: 'heart_rate_bpm', metric: 'heart_rate_bpm' },
  ];

  for (const { key, metric } of metrics) {
    const value = measurement[key];
    if (value == null) continue;

    const std = stdMap.get(metric);
    if (!std) continue;

    const info = METRIC_INFO[metric];
    const numValue = Number(value);
    const percentile = estimateFetalPercentile(numValue, std);
    const { status, statusLabel } = getFetalStatus(percentile);

    results.push({
      metric,
      label: info.label,
      icon: info.icon,
      value: numValue,
      unit: info.unit,
      p50: std.p50,
      percentile,
      status,
      statusLabel,
      norm: std,
    });
  }

  return results;
}
