'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { getTimelineEvents } from '@/lib/timeline';
import TimelineCard from './TimelineCard';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { key: 'all', label: '전체', emoji: '📌' },
  { key: 'pregnancy_planning', label: '임신계획', emoji: '📋' },
  { key: 'pregnancy', label: '임신', emoji: '🤰' },
  { key: 'postpartum', label: '산후', emoji: '🤱' },
  { key: 'parenting', label: '육아', emoji: '👶' },
  { key: 'work', label: '직장', emoji: '💼' },
  { key: 'government_support', label: '정부지원', emoji: '🏛️' },
];

export default function TimelineFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const hasTriedGenerate = useRef(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const data = await getTimelineEvents(userId, {
      limit: 100,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });

    // 시기 근접도 정렬: priority 높은 것 먼저, 그 다음 최신
    const sorted = [...data].sort((a, b) => {
      // priority 기준 (낮은 숫자 = 높은 우선순위)
      const pa = a.content?.priority ?? 5;
      const pb = b.content?.priority ?? 5;
      if (pa !== pb) return pa - pb;
      // 그 다음 생성일 최신
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setEvents(sorted);
    setLoading(false);
    return sorted;
  }, [userId, selectedCategory]);

  // 이벤트가 없으면 자동 생성 트리거
  const generateIfEmpty = useCallback(async (currentEvents: TimelineEvent[]) => {
    if (currentEvents.length > 0 || hasTriedGenerate.current) return;
    hasTriedGenerate.current = true;

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/timeline/my', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.created > 0) {
        // 새로 생성됐으면 다시 로드
        await loadEvents();
      }
    } catch (e) {
      console.error('Auto-generate failed:', e);
    }
    setGenerating(false);
  }, [loadEvents]);

  useEffect(() => {
    loadEvents().then(generateIfEmpty);
  }, [loadEvents, generateIfEmpty]);

  return (
    <div className="flex flex-col h-full">
      {/* Category Filter */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'glass text-gray-600 hover:text-gray-800'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading || generating ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
            {generating && (
              <p className="text-sm text-gray-500 animate-pulse">
                맞춤 콘텐츠를 준비하고 있어요...
              </p>
            )}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 space-y-4 animate-fade-in">
            <span className="text-6xl">📭</span>
            <p className="text-lg font-bold text-gray-600">
              아직 타임라인이 없어요
            </p>
            <p className="text-sm text-gray-500">
              프로필 정보를 기반으로 맞춤 콘텐츠가 곧 제공됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {events.map((event) => (
              <TimelineCard
                key={event.id}
                event={event}
                onUpdate={loadEvents}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
