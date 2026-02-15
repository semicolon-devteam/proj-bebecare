'use client';

import { useEffect, useState, useMemo } from 'react';
import { getPeerNorms, compareToPeers, getAgeMonths, type ComparisonResult, type PeerNorm } from '@/lib/peer-comparison';
import { getBabyLogs, type BabyLog } from '@/lib/baby-logs';
import { getChildren, type Child } from '@/lib/children';
import { Users, TrendingUp, TrendingDown, Minus, Baby, AlertCircle } from 'lucide-react';

interface PeerComparisonProps {
  userId: string;
}

function PercentileBar({ result }: { result: ComparisonResult }) {
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
          <span className="text-xl">{result.emoji}</span>
          <span className="text-sm font-bold text-gray-800">{result.label}</span>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${statusColor}`}>
          <StatusIcon className="h-3 w-3" />
          {result.statusLabel}
        </span>
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900">{result.value}</span>
        <span className="text-sm text-gray-400">{result.unit}</span>
        <span className="text-xs text-gray-400 ml-auto">또래 평균 {result.p50}{result.unit}</span>
      </div>

      {/* Percentile bar */}
      <div className="relative">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
          {/* Background zones */}
          <div className="absolute inset-0 flex">
            <div className="w-[25%] bg-amber-100/50" />
            <div className="w-[50%] bg-green-100/50" />
            <div className="w-[25%] bg-blue-100/50" />
          </div>
          {/* Value indicator */}
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-500 relative`}
            style={{ width: `${Math.max(5, Math.min(95, result.percentile))}%` }}
          />
        </div>
        {/* P50 marker */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gray-400" />
        {/* Labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-300">하위</span>
          <span className="text-[9px] text-gray-400 font-semibold">상위 {100 - result.percentile}%</span>
          <span className="text-[9px] text-gray-300">상위</span>
        </div>
      </div>

      {/* Norm range */}
      {result.norm && (
        <div className="mt-2 text-[10px] text-gray-400">
          또래 범위: {result.norm.p25}~{result.norm.p75} {result.unit} (25~75백분위)
        </div>
      )}
    </div>
  );
}

export default function PeerComparison({ userId }: PeerComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<Child | null>(null);
  const [todayLogs, setTodayLogs] = useState<BabyLog[]>([]);
  const [norms, setNorms] = useState<PeerNorm[]>([]);
  const [noChild, setNoChild] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Get born children
      const children = await getChildren(userId);
      const bornChild = children.find(c => c.status === 'born' && c.birth_date);
      if (!bornChild || !bornChild.birth_date) {
        setNoChild(true);
        setLoading(false);
        return;
      }

      setChild(bornChild);

      // Get age and norms
      const ageMonths = getAgeMonths(bornChild.birth_date);
      const peerNorms = await getPeerNorms(ageMonths);
      setNorms(peerNorms);

      // Get today's logs
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const logs = await getBabyLogs(userId, dateStr);
      setTodayLogs(logs);

      setLoading(false);
    }
    load();
  }, [userId]);

  const results = useMemo(() => {
    if (norms.length === 0 || todayLogs.length === 0) return [];
    return compareToPeers(todayLogs, norms);
  }, [todayLogs, norms]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
      </div>
    );
  }

  if (noChild) {
    return (
      <div className="text-center py-12 px-4">
        <Baby className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500">출생한 아이 정보가 필요해요</p>
        <p className="text-xs text-gray-400 mt-1">마이페이지에서 아이 정보를 등록해주세요</p>
      </div>
    );
  }

  const ageMonths = child?.birth_date ? getAgeMonths(child.birth_date) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Users className="h-5 w-5 text-dusty-rose" />
        <h3 className="text-base font-bold text-gray-900">또래 비교</h3>
        <span className="text-xs text-gray-400 ml-auto">
          {child?.nickname || '아이'} · {ageMonths}개월
        </span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-semibold">오늘 기록이 없어요</p>
          <p className="text-xs text-gray-400 mt-1">기록을 추가하면 또래와 비교해드릴게요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map(r => (
            <PercentileBar key={r.metric} result={r} />
          ))}
        </div>
      )}

      {/* Info note */}
      <p className="text-[10px] text-gray-400 text-center px-4">
        WHO, AAP, 질병관리청 기준 참고 · 정확한 진단은 소아과 상담 권장
      </p>
    </div>
  );
}
