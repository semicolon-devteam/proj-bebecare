'use client';

import { useEffect, useState } from 'react';
import { getBabyLogs, computeDailySummary, type DailySummary } from '@/lib/baby-logs';
import { Milk, Moon, Baby } from 'lucide-react';

interface TodaySummaryProps {
  userId: string;
  refreshKey?: number;
}

export default function TodaySummary({ userId, refreshKey }: TodaySummaryProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodaySummary = async () => {
      try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const logs = await getBabyLogs(userId, dateStr);
        const todaySummary = computeDailySummary(logs);
        setSummary(todaySummary);
      } catch (error) {
        console.error('Error loading today summary:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTodaySummary();
  }, [userId, refreshKey]);

  if (loading || !summary) return null;

  const formatSleepTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`;
    }
    return `${mins}분`;
  };

  const totalFeedingCount = summary.totalBreastCount + Math.floor((summary.totalFormulaMl + summary.totalBabyFoodMl) / 120); // 대략적 계산
  const totalFeedingMl = summary.totalFormulaMl + summary.totalBabyFoodMl;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">오늘의 요약</h3>
      <div className="grid grid-cols-3 gap-3">
        {/* 수유 */}
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center">
              <Milk className="h-4 w-4 text-orange-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">{totalFeedingCount}회</p>
            {totalFeedingMl > 0 && (
              <p className="text-xs text-gray-500">{totalFeedingMl}ml</p>
            )}
            <p className="text-xs font-medium text-gray-600">수유</p>
          </div>
        </div>

        {/* 수면 */}
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center">
              <Moon className="h-4 w-4 text-indigo-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900">
              {summary.totalSleepMinutes > 0 ? formatSleepTime(summary.totalSleepMinutes) : '0분'}
            </p>
            <p className="text-xs font-medium text-gray-600">수면</p>
          </div>
        </div>

        {/* 기저귀 */}
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center">
              <Baby className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-900">{summary.totalDiaperCount}회</p>
            <p className="text-xs font-medium text-gray-600">기저귀</p>
          </div>
        </div>
      </div>
    </div>
  );
}