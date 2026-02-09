'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { getTimelineEvents } from '@/lib/timeline';
import TimelineCard from './TimelineCard';
import { supabase } from '@/lib/supabase';
import { getChildren } from '@/lib/children';
import type { Child } from '@/lib/children';

const CATEGORIES = [
  { key: 'all', label: '전체', emoji: '📌' },
  { key: 'pregnancy_planning', label: '임신계획', emoji: '📋' },
  { key: 'pregnancy', label: '임신', emoji: '🤰' },
  { key: 'postpartum', label: '산후', emoji: '🤱' },
  { key: 'parenting', label: '육아', emoji: '👶' },
  { key: 'work', label: '직장', emoji: '💼' },
  { key: 'government_support', label: '정부지원', emoji: '🏛️' },
];

interface ProfileContext {
  stage: string;
  currentWeek?: number;
  ageMonths?: number;
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
  children: Child[];
  selectedChildId?: string;
}

function computeDdayValue(event: TimelineEvent, profile: ProfileContext): number | null {
  const c = event.content;
  if (!c) return null;

  if (c.week_start != null && profile.pregnancyStartDate) {
    const contentDate = new Date(profile.pregnancyStartDate.getTime() + c.week_start * 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contentDate.setHours(0, 0, 0, 0);
    return Math.round((contentDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

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

function computeSortScore(event: TimelineEvent, profile: ProfileContext): number {
  const ddayValue = computeDdayValue(event, profile);
  if (ddayValue === null) return 5000;
  if (ddayValue >= 0) return ddayValue;
  return 10000 + Math.abs(ddayValue);
}

export default function TimelineFeed({ userId }: { userId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [profileCtx, setProfileCtx] = useState<ProfileContext>({ stage: 'planning', children: [] });
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [showPast, setShowPast] = useState(false);
  const hasTriedGenerate = useRef(false);

  // 프로필 + 아이 정보 로드
  useEffect(() => {
    async function loadProfile() {
      const [profileRes, childrenData] = await Promise.all([
        supabase.from('profiles').select('stage, due_date, pregnancy_start_date').eq('user_id', userId).single(),
        getChildren(userId),
      ]);

      const profile = profileRes.data;
      const ctx: ProfileContext = { stage: profile?.stage || 'planning', children: childrenData };

      // 선택된 아이 기준으로 D-Day 컨텍스트 설정
      const targetChild = selectedChildId !== 'all'
        ? childrenData.find(c => c.id === selectedChildId)
        : childrenData[0]; // 기본: 첫 번째 아이

      if (targetChild) {
        if (targetChild.status === 'expecting' && targetChild.pregnancy_start_date) {
          const start = new Date(targetChild.pregnancy_start_date);
          const days = Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000));
          ctx.currentWeek = Math.max(1, Math.floor(days / 7));
          ctx.pregnancyStartDate = start;
        } else if (targetChild.status === 'born' && targetChild.birth_date) {
          const birth = new Date(targetChild.birth_date);
          ctx.ageMonths = Math.floor((Date.now() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
          ctx.childBirthDate = birth;
        }
      } else if (profile) {
        // Fallback to profile data
        if (profile.stage === 'pregnant' && profile.due_date) {
          const dueDate = new Date(profile.due_date);
          const start = profile.pregnancy_start_date
            ? new Date(profile.pregnancy_start_date)
            : new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
          const days = Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000));
          ctx.currentWeek = Math.max(1, Math.floor(days / 7));
          ctx.pregnancyStartDate = start;
        }
      }

      setProfileCtx(ctx);
    }
    loadProfile();
  }, [userId, selectedChildId]);

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

  const generateIfEmpty = useCallback(async (currentEvents: TimelineEvent[]) => {
    if (currentEvents.length > 0 || hasTriedGenerate.current) return;
    hasTriedGenerate.current = true;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/timeline/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.created > 0) await loadEvents();
    } catch (e) { console.error('Auto-generate failed:', e); }
    setGenerating(false);
  }, [loadEvents]);

  useEffect(() => {
    loadEvents().then(generateIfEmpty);
  }, [loadEvents, generateIfEmpty]);

  const { visibleEvents: sortedEvents, pastCount } = (() => {
    const withDday = events.map(e => ({
      event: e,
      ddayValue: computeDdayValue(e, profileCtx),
      sortScore: computeSortScore(e, profileCtx),
    }));
    withDday.sort((a, b) => a.sortScore - b.sortScore);

    const futureOrNoDate = withDday.filter(d => d.ddayValue === null || d.ddayValue >= 0);
    const past = withDday.filter(d => d.ddayValue !== null && d.ddayValue < 0);
    const base = showPast ? [...futureOrNoDate, ...past] : futureOrNoDate;

    if (selectedCategory === 'all') {
      let govCount = 0;
      const filtered = base.filter(({ event }) => {
        if (event.content?.category === 'government_support') {
          govCount++;
          return govCount <= 5;
        }
        return true;
      });
      return { visibleEvents: filtered.map(s => s.event), pastCount: past.length };
    }
    return { visibleEvents: base.map(s => s.event), pastCount: past.length };
  })();

  const childrenForTabs = profileCtx.children;

  return (
    <div className="flex flex-col h-full">
      {/* 아이별 탭 (아이가 2명 이상일 때만 표시) */}
      {childrenForTabs.length > 1 && (
        <div className="px-4 pt-2 pb-1 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedChildId('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                selectedChildId === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'glass text-gray-600 hover:text-gray-800'
              }`}
            >
              👨‍👩‍👧‍👦 전체
            </button>
            {childrenForTabs.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                  selectedChildId === child.id
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                    : 'glass text-gray-600 hover:text-gray-800'
                }`}
              >
                {child.status === 'expecting' ? '🤰' : '👶'} {child.nickname || child.name || '아이'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* D-Day 배너 */}
      {profileCtx.currentWeek && (
        <div className="mx-4 mt-2 mb-1 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 px-4 py-2 text-center">
          <span className="text-sm font-bold text-pink-600">
            🤰 임신 {profileCtx.currentWeek}주차
            {profileCtx.children.find(c => c.id === selectedChildId || selectedChildId === 'all')?.due_date &&
              ` · 예정일까지 D-${Math.max(0, Math.round(((new Date(profileCtx.children.find(c => c.id === selectedChildId || selectedChildId === 'all')?.due_date || '').getTime()) - Date.now()) / (24 * 60 * 60 * 1000)))}`
            }
          </span>
        </div>
      )}
      {profileCtx.ageMonths !== undefined && profileCtx.ageMonths >= 0 && (
        <div className="mx-4 mt-2 mb-1 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 text-center">
          <span className="text-sm font-bold text-blue-600">
            👶 생후 {profileCtx.ageMonths}개월
          </span>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'glass text-gray-600 hover:text-gray-800'
              }`}>{cat.emoji} {cat.label}</button>
          ))}
        </div>
      </div>

      {pastCount > 0 && (
        <div className="px-4 pb-2">
          <button onClick={() => setShowPast(!showPast)}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
            {showPast ? '📂 지난 항목 숨기기' : `📁 지난 항목 보기 (${pastCount})`}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading || generating ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
            {generating && <p className="text-sm text-gray-500 animate-pulse">맞춤 콘텐츠를 준비하고 있어요...</p>}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-20 space-y-4 animate-fade-in">
            <span className="text-6xl">📭</span>
            <p className="text-lg font-bold text-gray-600">아직 타임라인이 없어요</p>
            <p className="text-sm text-gray-500">프로필 정보를 기반으로 맞춤 콘텐츠가 곧 제공됩니다</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {sortedEvents.map((event) => (
              <TimelineCard key={event.id} event={event} onUpdate={loadEvents} profile={profileCtx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
