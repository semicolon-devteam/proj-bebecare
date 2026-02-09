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

// 카테고리 우선순위 (낮을수록 상단)
const CATEGORY_ORDER: Record<string, number> = {
  pregnancy_planning: 0,
  pregnancy: 0,
  postpartum: 0,
  parenting: 0,
  work: 1,
  government_support: 2,
};

interface ProfileContext {
  stage: string;
  currentWeek?: number;
  ageMonths?: number;
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
}

function computeRelevanceScore(event: TimelineEvent, profile: ProfileContext): number {
  const c = event.content;
  if (!c) return 999;

  const catOrder = CATEGORY_ORDER[c.category] ?? 1;

  // 시기 매칭 점수 (0 = 정확 매칭, 숫자 클수록 먼 시기)
  let timeDistance = 50; // 기본값 (시기 정보 없는 콘텐츠)

  if (profile.stage === 'pregnant' && profile.currentWeek && c.week_start !== null && c.week_end !== null) {
    const midWeek = (c.week_start + c.week_end) / 2;
    timeDistance = Math.abs(profile.currentWeek - midWeek);
  } else if ((profile.stage === 'postpartum' || profile.stage === 'parenting') && profile.ageMonths !== undefined) {
    if (c.month_start !== null && c.month_end !== null) {
      const midMonth = (c.month_start + c.month_end) / 2;
      timeDistance = Math.abs(profile.ageMonths - midMonth);
    } else if (c.week_start !== null && c.week_end !== null) {
      const midWeek = (c.week_start + c.week_end) / 2;
      const ageWeeks = profile.ageMonths * 4.35;
      timeDistance = Math.abs(ageWeeks - midWeek) / 4.35; // normalize to months
    }
  }

  // 미읽은 콘텐츠 보너스
  const unreadBonus = event.is_read ? 10 : 0;

  // 최종 점수: catOrder * 100 + timeDistance + unreadBonus
  return catOrder * 100 + timeDistance + unreadBonus;
}

export default function TimelineFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [profileCtx, setProfileCtx] = useState<ProfileContext>({ stage: 'planning' });
  const hasTriedGenerate = useRef(false);

  // 프로필 로드 (시기 정보용)
  useEffect(() => {
    async function loadProfile() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stage, due_date, pregnancy_start_date')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      const ctx: ProfileContext = { stage: profile.stage || 'planning' };

      if (profile.stage === 'pregnant' && profile.due_date) {
        const dueDate = new Date(profile.due_date);
        const start = profile.pregnancy_start_date
          ? new Date(profile.pregnancy_start_date)
          : new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
        const days = Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000));
        ctx.currentWeek = Math.max(1, Math.floor(days / 7));
        ctx.pregnancyStartDate = start;
      }

      // 산후/육아는 첫 자녀 기준
      if (profile.stage === 'postpartum' || profile.stage === 'parenting') {
        const { data: children } = await supabase
          .from('children')
          .select('birth_date')
          .eq('user_id', userId)
          .order('birth_date', { ascending: false })
          .limit(1);

        if (children?.[0]) {
          const birth = new Date(children[0].birth_date);
          ctx.ageMonths = Math.floor((Date.now() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
          ctx.childBirthDate = birth;
        }
      }

      setProfileCtx(ctx);
    }
    loadProfile();
  }, [userId]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const data = await getTimelineEvents(userId, {
      limit: 200,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    });
    setEvents(data);
    setLoading(false);
    return data;
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.created > 0) {
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

  // 정렬 + 피드 상한 적용
  const sortedEvents = (() => {
    const scored = events.map(e => ({
      event: e,
      score: computeRelevanceScore(e, profileCtx),
    }));
    scored.sort((a, b) => a.score - b.score);

    // "전체" 탭에서 정부지원 상한 5개
    if (selectedCategory === 'all') {
      let govCount = 0;
      const MAX_GOV = 5;
      return scored
        .filter(({ event }) => {
          if (event.content?.category === 'government_support') {
            govCount++;
            return govCount <= MAX_GOV;
          }
          return true;
        })
        .map(s => s.event);
    }

    return scored.map(s => s.event);
  })();

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
        ) : sortedEvents.length === 0 ? (
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
            {sortedEvents.map((event) => (
              <TimelineCard
                key={event.id}
                event={event}
                onUpdate={loadEvents}
                profile={profileCtx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
