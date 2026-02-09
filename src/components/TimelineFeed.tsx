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

/**
 * D-Day 값 계산 (양수 = 미래, 음수 = 과거, null = 시기 정보 없음)
 * 예: D-23 → 23, D+40 → -40, D-Day → 0
 */
function computeDdayValue(event: TimelineEvent, profile: ProfileContext): number | null {
  const c = event.content;
  if (!c) return null;

  // week_start 기반 (임신 주차 기준)
  if (c.week_start != null && profile.pregnancyStartDate) {
    const contentDate = new Date(profile.pregnancyStartDate.getTime() + c.week_start * 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contentDate.setHours(0, 0, 0, 0);
    return Math.round((contentDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  // month_start 기반 (출산 후)
  if (c.month_start != null && profile.childBirthDate) {
    const contentDate = new Date(profile.childBirthDate);
    contentDate.setMonth(contentDate.getMonth() + c.month_start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contentDate.setHours(0, 0, 0, 0);
    return Math.round((contentDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  return null;
}

/**
 * 정렬 점수: D-Day 임박(양수 작은 값) → 상단, D-Day 없으면 하단
 * 미래(D-) → 값이 작을수록 상단 (0이 가장 임박)
 * 과거(D+) → 큰 양수로 밀어냄
 * 시기 없음 → 중간
 */
function computeSortScore(event: TimelineEvent, profile: ProfileContext): number {
  const ddayValue = computeDdayValue(event, profile);

  if (ddayValue === null) return 5000; // 시기 없음 → 중간 배치

  if (ddayValue >= 0) {
    // 미래: D-Day 가까울수록 상단 (0 → 가장 위)
    return ddayValue;
  } else {
    // 과거: D+ 값이 클수록 아래 (최근 지난 것이 위)
    return 10000 + Math.abs(ddayValue);
  }
}

export default function TimelineFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [profileCtx, setProfileCtx] = useState<ProfileContext>({ stage: 'planning' });
  const [showPast, setShowPast] = useState(false);
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

  // D-Day 기반 정렬 + 과거 항목 필터 + 피드 상한
  const { visibleEvents: sortedEvents, pastCount } = (() => {
    const withDday = events.map(e => ({
      event: e,
      ddayValue: computeDdayValue(e, profileCtx),
      sortScore: computeSortScore(e, profileCtx),
    }));

    // D-Day 임박 순 정렬
    withDday.sort((a, b) => a.sortScore - b.sortScore);

    // 과거 항목 분리
    const futureOrNoDate = withDday.filter(d => d.ddayValue === null || d.ddayValue >= 0);
    const past = withDday.filter(d => d.ddayValue !== null && d.ddayValue < 0);

    const base = showPast ? [...futureOrNoDate, ...past] : futureOrNoDate;

    // "전체" 탭에서 정부지원 상한 5개
    if (selectedCategory === 'all') {
      let govCount = 0;
      const MAX_GOV = 5;
      const filtered = base.filter(({ event }) => {
        if (event.content?.category === 'government_support') {
          govCount++;
          return govCount <= MAX_GOV;
        }
        return true;
      });
      return { visibleEvents: filtered.map(s => s.event), pastCount: past.length };
    }

    return { visibleEvents: base.map(s => s.event), pastCount: past.length };
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

      {/* Past items toggle */}
      {pastCount > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowPast(!showPast)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPast ? '📂 지난 항목 숨기기' : `📁 지난 항목 보기 (${pastCount})`}
          </button>
        </div>
      )}

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
