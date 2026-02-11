'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { getTimelineEvents } from '@/lib/timeline';
import TimelineCard from './TimelineCard';
import { supabase } from '@/lib/supabase';
import { getChildren } from '@/lib/children';
import type { Child } from '@/lib/children';
import { ChevronDown, ChevronUp, LayoutList } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'pregnancy_planning', label: '임신계획' },
  { key: 'pregnancy', label: '임신' },
  { key: 'postpartum', label: '산후' },
  { key: 'parenting', label: '육아' },
  { key: 'work', label: '직장' },
  { key: 'government_support', label: '정부지원' },
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
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'baby' | 'parent'>('all');
  const [profileCtx, setProfileCtx] = useState<ProfileContext>({ stage: 'planning', children: [] });
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [showPast, setShowPast] = useState(false);
  const hasTriedGenerate = useRef(false);

  useEffect(() => {
    async function loadProfile() {
      const [profileRes, childrenData] = await Promise.all([
        supabase.from('profiles').select('stage, due_date, pregnancy_start_date').eq('user_id', userId).single(),
        getChildren(userId),
      ]);

      const profile = profileRes.data;
      const ctx: ProfileContext = { stage: profile?.stage || 'planning', children: childrenData };

      const targetChild = selectedChildId !== 'all'
        ? childrenData.find(c => c.id === selectedChildId)
        : childrenData[0];

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

    // Filter by audience
    const audienceFiltered = selectedAudience === 'all'
      ? base
      : base.filter(({ event }) => {
          const ta = event.content?.target_audience;
          return !ta || ta === 'all' || ta === selectedAudience;
        });

    if (selectedCategory === 'all') {
      let govCount = 0;
      const filtered = audienceFiltered.filter(({ event }) => {
        if (event.content?.category === 'government_support') {
          govCount++;
          return govCount <= 5;
        }
        return true;
      });
      return { visibleEvents: filtered.map(s => s.event), pastCount: past.length };
    }
    return { visibleEvents: audienceFiltered.map(s => s.event), pastCount: past.length };
  })();

  const childrenForTabs = profileCtx.children;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Child tabs */}
      {childrenForTabs.length > 1 && (
        <div className="px-4 pt-3 pb-1 overflow-x-auto bg-white border-b border-border">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedChildId('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedChildId === 'all'
                  ? 'bg-dusty-rose text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              전체
            </button>
            {childrenForTabs.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedChildId === child.id
                    ? 'bg-dusty-rose text-white'
                    : 'bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                {child.nickname || child.name || '아이'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* D-Day banner */}
      {profileCtx.currentWeek && (
        <div className="mx-4 mt-3 mb-1 rounded-xl border border-pink-100 bg-pink-50 px-4 py-2.5 text-center">
          <span className="text-sm font-semibold text-dusty-rose">
            임신 {profileCtx.currentWeek}주차
            {profileCtx.children.find(c => c.id === selectedChildId || selectedChildId === 'all')?.due_date &&
              ` · 예정일까지 D-${Math.max(0, Math.round(((new Date(profileCtx.children.find(c => c.id === selectedChildId || selectedChildId === 'all')?.due_date || '').getTime()) - Date.now()) / (24 * 60 * 60 * 1000)))}`
            }
          </span>
        </div>
      )}
      {profileCtx.ageMonths !== undefined && profileCtx.ageMonths >= 0 && (
        <div className="mx-4 mt-3 mb-1 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-center">
          <span className="text-sm font-semibold text-blue-600">
            생후 {profileCtx.ageMonths}개월
          </span>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-border text-gray-500 hover:text-gray-700'
              }`}>{cat.label}</button>
          ))}
        </div>
      </div>

      {/* Audience Filter (아기/엄마아빠) */}
      {selectedCategory === 'government_support' && (
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            {([
              { key: 'all', label: '전체' },
              { key: 'baby', label: '👶 아기' },
              { key: 'parent', label: '👨‍👩‍👧 엄마아빠' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedAudience(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedAudience === tab.key
                    ? 'bg-violet-600 text-white'
                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {pastCount > 0 && (
        <div className="px-4 pb-2">
          <button onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors">
            {showPast ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                지난 항목 숨기기
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                지난 항목 보기 ({pastCount})
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading || generating ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
            {generating && <p className="text-sm text-gray-400">맞춤 콘텐츠를 준비하고 있어요...</p>}
          </div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <LayoutList className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-600">아직 타임라인이 없어요</p>
            <p className="text-sm text-gray-400">프로필 정보를 기반으로 맞춤 콘텐츠가 곧 제공됩니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => (
              <TimelineCard key={event.id} event={event} onUpdate={loadEvents} profile={profileCtx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
