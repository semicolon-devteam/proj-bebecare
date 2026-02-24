'use client';

import { useEffect, useState } from 'react';
import { getBabyLogs, computeDailySummary, type DailySummary } from '@/lib/baby-logs';
import { Milk, Moon, Baby, Droplets } from 'lucide-react';
import { Card } from '@/components/ui';

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

  const formatSleepTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`;
    }
    return `${mins}분`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-body font-bold text-gray-700">오늘의 요약</h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} padding="md" className="animate-pulse">
              <div className="h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const totalFeedingCount = summary.totalBreastCount + Math.floor((summary.totalFormulaMl + summary.totalBabyFoodMl) / 120);
  const totalFeedingMl = summary.totalFormulaMl + summary.totalBabyFoodMl;

  const stats = [
    {
      icon: Milk,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      label: '수유',
      value: `${totalFeedingCount}회`,
      sub: totalFeedingMl > 0 ? `${totalFeedingMl}ml` : null,
    },
    {
      icon: Moon,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      label: '수면',
      value: summary.totalSleepMinutes > 0 ? formatSleepTime(summary.totalSleepMinutes) : '0분',
      sub: null,
    },
    {
      icon: Baby,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      label: '기저귀',
      value: `${summary.totalDiaperCount}회`,
      sub: null,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-body font-bold text-gray-700">오늘의 요약</h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} shadow="sm" padding="md" hover="lift" className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className={`h-10 w-10 rounded-full ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} aria-hidden="true" />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-body-lg font-bold text-gray-900">{stat.value}</p>
                {stat.sub && (
                  <p className="text-caption text-gray-500">{stat.sub}</p>
                )}
                <p className="text-caption font-medium text-gray-600 mt-1">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
