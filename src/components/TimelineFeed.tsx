'use client';

import { useEffect, useState, useCallback } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { getTimelineEvents } from '@/lib/timeline';
import TimelineCard from './TimelineCard';

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
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const data = await getTimelineEvents(userId, {
      limit: 50,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    setEvents(data);
    setLoading(false);
  }, [userId, selectedCategory]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
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
