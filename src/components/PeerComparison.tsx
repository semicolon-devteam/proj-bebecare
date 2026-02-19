'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getPeerNorms, compareToPeers, getAgeMonths, getAgeWeeks, type ComparisonResult, type PeerNorm } from '@/lib/peer-comparison';
import { getBabyLogs, type BabyLog } from '@/lib/baby-logs';
import { getChildren, type Child } from '@/lib/children';
import {
  addFetalMeasurement,
  getFetalMeasurements,
  getFetalGrowthStandards,
  compareFetalToPeers,
  type FetalMeasurement,
  type FetalComparisonResult,
  type FetalGrowthStandard,
} from '@/lib/fetal-measurements';
import { Users, TrendingUp, TrendingDown, Minus, Baby, AlertCircle, Plus, X, Calendar, ChevronDown, ChevronUp, Microscope, Heart } from 'lucide-react';
import { IconByName } from '@/lib/icon-map';

interface PeerComparisonProps {
  userId: string;
}

type AnyComparisonResult = ComparisonResult | FetalComparisonResult;

function PercentileBar({ result }: { result: AnyComparisonResult }) {
  const barColor =
    result.status === 'low' ? 'bg-amber-400' :
    result.status === 'high' ? 'bg-blue-400' :
    'bg-green-400';

  const statusColor =
    result.status === 'low' ? 'text-amber-600 bg-amber-50' :
    result.status === 'high' ? 'text-blue-600 bg-blue-50' :
    'text-green-600 bg-green-50';

  const StatusIcon =
    result.status === 'low' ? TrendingDown :
    result.status === 'high' ? TrendingUp :
    Minus;

  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
            <IconByName name={result.icon} className="h-4 w-4 text-gray-600" />
          </span>
          <span className="text-sm font-bold text-gray-800">{result.label}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
          <StatusIcon className="h-3 w-3" aria-hidden="true" />
          {result.statusLabel}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900">{result.value}</span>
        <span className="text-sm text-gray-400">{result.unit}</span>
        <span className="text-xs text-gray-400 ml-auto">또래 평균 {result.p50}{result.unit}</span>
      </div>

      <div className="relative">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="w-[25%] bg-amber-100/50" />
            <div className="w-[50%] bg-green-100/50" />
            <div className="w-[25%] bg-blue-100/50" />
          </div>
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500 relative`}
            style={{ width: `${Math.max(5, Math.min(95, result.percentile))}%` }}
          />
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gray-400" />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-300">하위</span>
          <span className="text-[9px] text-gray-400 font-semibold">상위 {100 - result.percentile}%</span>
          <span className="text-[9px] text-gray-300">상위</span>
        </div>
      </div>

      {result.norm && (
        <div className="mt-2 text-[10px] text-gray-400">
          또래 범위: {'p25' in result.norm ? result.norm.p25 : ''}~{'p75' in result.norm ? result.norm.p75 : ''} {result.unit} (25~75백분위)
        </div>
      )}
    </div>
  );
}

/* ── Fetal Measurement Modal ── */
function FetalMeasurementModal({
  userId,
  childId,
  defaultWeek,
  onClose,
  onSaved,
}: {
  userId: string;
  childId?: string;
  defaultWeek: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [week, setWeek] = useState(defaultWeek);
  const [bpd, setBpd] = useState('');
  const [fl, setFl] = useState('');
  const [ac, setAc] = useState('');
  const [hc, setHc] = useState('');
  const [efw, setEfw] = useState('');
  const [hr, setHr] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const hasAnyValue = bpd || fl || ac || hc || efw || hr;

  const handleSave = async () => {
    if (!hasAnyValue) return;
    setSaving(true);
    await addFetalMeasurement(userId, {
      child_id: childId || null,
      week,
      bpd_mm: bpd ? parseFloat(bpd) : null,
      fl_mm: fl ? parseFloat(fl) : null,
      ac_mm: ac ? parseFloat(ac) : null,
      hc_mm: hc ? parseFloat(hc) : null,
      efw_g: efw ? parseFloat(efw) : null,
      heart_rate_bpm: hr ? parseInt(hr) : null,
      memo: memo || null,
    });
    setSaving(false);
    onSaved();
  };

  const fields = [
    { label: 'BPD (머리 직경)', unit: 'mm', value: bpd, set: setBpd, step: '0.1' },
    { label: 'FL (대퇴골 길이)', unit: 'mm', value: fl, set: setFl, step: '0.1' },
    { label: 'AC (복부 둘레)', unit: 'mm', value: ac, set: setAc, step: '0.1' },
    { label: 'HC (머리 둘레)', unit: 'mm', value: hc, set: setHc, step: '0.1' },
    { label: 'EFW (예측 체중)', unit: 'g', value: efw, set: setEfw, step: '1' },
    { label: '심박수', unit: 'bpm', value: hr, set: setHr, step: '1' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Microscope className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
              초음파 측정값 입력
            </h3>
            <button onClick={onClose} aria-label="닫기" className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
          </div>

          {/* Week selector */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">임신 주차</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-dusty-rose" aria-hidden="true" />
              <input
                type="number"
                min={8}
                max={42}
                value={week}
                onChange={e => setWeek(parseInt(e.target.value) || defaultWeek)}
                className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
              />
              <span className="text-sm text-gray-500">주차</span>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {fields.map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    step={f.step}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 pr-12 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Memo */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">메모</label>
            <textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="특이사항이 있다면 기록해주세요"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose resize-none"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!hasAnyValue || saving}
            className="w-full py-3 bg-dusty-rose text-white font-semibold rounded-xl disabled:opacity-40 transition-opacity"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PeerComparison({ userId }: PeerComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<Child | null>(null);
  const [mode, setMode] = useState<'born' | 'expecting' | 'none'>('none');

  // Born mode state
  const [todayLogs, setTodayLogs] = useState<BabyLog[]>([]);
  const [norms, setNorms] = useState<PeerNorm[]>([]);

  // Fetal mode state
  const [fetalMeasurements, setFetalMeasurements] = useState<FetalMeasurement[]>([]);
  const [fetalStandards, setFetalStandards] = useState<FetalGrowthStandard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const children = await getChildren(userId);

    const bornChild = children.find(c => c.status === 'born' && c.birth_date);
    const expectingChild = children.find(c => c.status === 'expecting' && c.pregnancy_start_date);

    if (bornChild?.birth_date) {
      setChild(bornChild);
      setMode('born');
      const ageMonths = getAgeMonths(bornChild.birth_date);
      const peerNorms = await getPeerNorms(ageMonths);
      setNorms(peerNorms);
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const logs = await getBabyLogs(userId, dateStr);
      setTodayLogs(logs);
    } else if (expectingChild?.pregnancy_start_date) {
      setChild(expectingChild);
      setMode('expecting');
      const weeks = getAgeWeeks(expectingChild.pregnancy_start_date);
      const clampedWeek = Math.max(12, Math.min(40, weeks));
      const [measurements, standards] = await Promise.all([
        getFetalMeasurements(userId, expectingChild.id),
        getFetalGrowthStandards(clampedWeek),
      ]);
      setFetalMeasurements(measurements);
      setFetalStandards(standards);
    } else {
      setMode('none');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const bornResults = useMemo(() => {
    if (mode !== 'born' || norms.length === 0 || todayLogs.length === 0) return [];
    return compareToPeers(todayLogs, norms);
  }, [mode, todayLogs, norms]);

  const fetalResults = useMemo(() => {
    if (mode !== 'expecting' || fetalMeasurements.length === 0 || fetalStandards.length === 0) return [];
    return compareFetalToPeers(fetalMeasurements[0], fetalStandards);
  }, [mode, fetalMeasurements, fetalStandards]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
      </div>
    );
  }

  if (mode === 'none') {
    return (
      <div className="text-center py-12 px-4">
        <Baby className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-semibold text-gray-500">아이 정보가 필요해요</p>
        <p className="text-xs text-gray-400 mt-1">마이페이지에서 아이 정보를 등록해주세요</p>
      </div>
    );
  }

  /* ── Born mode ── */
  if (mode === 'born') {
    const ageMonths = child?.birth_date ? getAgeMonths(child.birth_date) : 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Users className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
          <h3 className="text-base font-bold text-gray-900">또래 비교</h3>
          <span className="text-xs text-gray-400 ml-auto">
            {child?.nickname || '아이'} · {ageMonths}개월
          </span>
        </div>

        {bornResults.length === 0 ? (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500 font-semibold">또래 비교 데이터가 준비 중이에요</p>
            <p className="text-xs text-gray-400 mt-1">오늘 수유·수면·기저귀 기록을 추가하면 또래와 비교해드릴게요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bornResults.map(r => (
              <PercentileBar key={r.metric} result={r} />
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center px-4">
          WHO, AAP, 질병관리청 기준 참고 · 정확한 진단은 소아과 상담 권장
        </p>
      </div>
    );
  }

  /* ── Expecting (fetal) mode ── */
  const weeks = child?.pregnancy_start_date ? getAgeWeeks(child.pregnancy_start_date) : 0;
  const latestMeasurement = fetalMeasurements[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Baby className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
        <h3 className="text-base font-bold text-gray-900">태아 성장 비교</h3>
        <span className="text-xs text-gray-400 ml-auto">
          {child?.nickname || '태명'} · 임신 {weeks}주차
        </span>
      </div>

      {fetalResults.length === 0 ? (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-2">
            <Microscope className="h-6 w-6 text-dusty-rose" aria-hidden="true" />
          </div>
          <p className="text-sm text-gray-500 font-semibold">
            초음파 측정값을 입력하면<br />또래와 비교해드릴게요
          </p>
          <p className="text-xs text-gray-400 mt-1.5 mb-4">
            BPD, FL, AC, HC, EFW 등 초음파 수치를 입력해보세요
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-dusty-rose text-white text-sm font-semibold rounded-xl"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            측정값 입력하기
          </button>
        </div>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-3">
            {fetalResults.map(r => (
              <PercentileBar key={r.metric} result={r} />
            ))}
          </div>

          {/* Action row */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-dusty-rose/10 text-dusty-rose text-sm font-semibold rounded-xl"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              새 측정값
            </button>
            <button
              onClick={() => setShowHistory(h => !h)}
              className="flex items-center gap-1 px-4 py-2.5 bg-gray-50 text-gray-500 text-sm font-semibold rounded-xl"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
              이력
            </button>
          </div>

          {/* Measurement history */}
          {showHistory && fetalMeasurements.length > 0 && (
            <div className="space-y-2">
              {fetalMeasurements.slice(0, 5).map(m => (
                <div key={m.id} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{m.week}주차</span>
                    <span className="text-[10px] text-gray-400">{m.measured_at}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    {m.efw_g != null && <span>체중 {m.efw_g}g</span>}
                    {m.bpd_mm != null && <span>BPD {m.bpd_mm}</span>}
                    {m.fl_mm != null && <span>FL {m.fl_mm}</span>}
                    {m.hc_mm != null && <span>HC {m.hc_mm}</span>}
                    {m.ac_mm != null && <span>AC {m.ac_mm}</span>}
                    {m.heart_rate_bpm != null && <span className="inline-flex items-center gap-0.5"><Heart className="h-3 w-3 text-pink-400" aria-hidden="true" />{m.heart_rate_bpm}</span>}
                  </div>
                  {m.memo && <p className="text-[10px] text-gray-400 mt-1">{m.memo}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-gray-400 text-center px-4">
        WHO/Hadlock 태아 성장 기준 참고 · 정확한 진단은 산부인과 상담 권장
      </p>

      {/* Modal */}
      {showModal && (
        <FetalMeasurementModal
          userId={userId}
          childId={child?.id}
          defaultWeek={Math.max(8, Math.min(42, weeks))}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
