'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { getTimelineEvents } from '@/lib/timeline';
import TimelineCard from './TimelineCard';
import { supabase } from '@/lib/supabase';
import { getChildren } from '@/lib/children';
import type { Child } from '@/lib/children';
import { ChevronDown, ChevronUp, LayoutList, MapPin, Shield, Palmtree, Clock, Coins, Briefcase, ClipboardList, Baby, Users } from 'lucide-react';
import EmptyStateIllustration from '@/components/illustrations/EmptyStateIllustration';
import { CuteLoader, FadeInUp } from '@/components/animations/MotionWrappers';
import WorkCalculator from './WorkCalculator';

const ALL_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'pregnancy_planning', label: '임신계획' },
  { key: 'pregnancy', label: '임신' },
  { key: 'postpartum', label: '산후' },
  { key: 'parenting', label: '육아' },
  { key: 'work', label: '직장' },
  { key: 'government_support', label: '정부지원' },
];

// stage별로 관련 있는 카테고리만 노출
const STAGE_CATEGORIES: Record<string, string[]> = {
  planning: ['all', 'pregnancy_planning', 'work', 'government_support'],
  pregnant: ['all', 'pregnancy_planning', 'pregnancy', 'work', 'government_support'],
  postpartum: ['all', 'postpartum', 'parenting', 'work', 'government_support'],
  parenting: ['all', 'parenting', 'work', 'government_support'],
};

function getCategoriesForStage(stage: string) {
  const allowed = STAGE_CATEGORIES[stage] || ALL_CATEGORIES.map(c => c.key);
  return ALL_CATEGORIES.filter(c => allowed.includes(c.key));
}

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

// stage와 관련 없는 카테고리인지 판별
const STAGE_RELEVANT_CATEGORIES: Record<string, string[]> = {
  planning: ['pregnancy_planning', 'work', 'government_support'],
  pregnant: ['pregnancy_planning', 'pregnancy', 'work', 'government_support'],
  postpartum: ['postpartum', 'parenting', 'work', 'government_support'],
  parenting: ['parenting', 'work', 'government_support'],
};

function isRelevantForStage(category: string, stage: string): boolean {
  const relevant = STAGE_RELEVANT_CATEGORIES[stage];
  if (!relevant) return true;
  return relevant.includes(category);
}

function computeSortScore(event: TimelineEvent, profile: ProfileContext): number {
  const ddayValue = computeDdayValue(event, profile);
  const base = ddayValue === null ? 5000 : ddayValue >= 0 ? ddayValue : 10000 + Math.abs(ddayValue);
  // stage에 맞지 않는 콘텐츠는 큰 페널티 부여 → 하단으로 밀림
  const category = event.content?.category;
  if (category && !isRelevantForStage(category, profile.stage)) {
    return base + 50000;
  }
  return base;
}

// 직장 탭 서브카테고리 그룹핑
const WORK_GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  protection: Shield,
  leave: Palmtree,
  worktime: Clock,
  benefits: Coins,
  life: Briefcase,
  other: ClipboardList,
};

const WORK_GROUPS: { key: string; label: string; subcategories: string[] }[] = [
  { key: 'protection', label: '모성보호 법적내용', subcategories: ['모성보호', '권리'] },
  { key: 'leave', label: '휴가·휴직 제도', subcategories: ['출산휴가', '육아휴직', '배우자', '배우자휴가'] },
  { key: 'worktime', label: '근로시간 제도', subcategories: ['근로시간', '유연근무'] },
  { key: 'benefits', label: '급여·지원', subcategories: ['급여'] },
  { key: 'life', label: '직장생활', subcategories: ['직장생활', '인수인계', '시간관리', '모유수유', '복직', '자영업', '돌봄'] },
];

function WorkGroupedEvents({
  events,
  onUpdate,
  profile,
}: {
  events: TimelineEvent[];
  onUpdate: () => void;
  profile: ProfileContext;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['protection', 'leave']));

  const grouped = useMemo(() => {
    const result: { key: string; label: string; events: TimelineEvent[] }[] = [];
    const used = new Set<string>();

    for (const group of WORK_GROUPS) {
      const matched = events.filter(e => {
        const sub = e.content?.subcategory;
        return sub && group.subcategories.includes(sub) && !used.has(e.id);
      });
      matched.forEach(e => used.add(e.id));
      if (matched.length > 0) {
        result.push({ key: group.key, label: group.label, events: matched });
      }
    }

    // 미분류
    const remaining = events.filter(e => !used.has(e.id));
    if (remaining.length > 0) {
      result.push({ key: 'other', label: '기타', events: remaining });
    }

    return result;
  }, [events]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {grouped.map(({ key, label, events: groupEvents }) => (
        <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => toggleGroup(key)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              {(() => { const IconComp = WORK_GROUP_ICONS[key] || ClipboardList; return <IconComp className="h-4 w-4 text-teal-500" />; })()}
              {label}
              <span className="text-xs text-gray-400">({groupEvents.length})</span>
            </span>
            {expandedGroups.has(key) ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {expandedGroups.has(key) && (
            <div className="p-3 space-y-2">
              {groupEvents.map(event => (
                <TimelineCard key={event.id} event={event} onUpdate={onUpdate} profile={profile} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getTimeSection(ddayValue: number | null): string {
  if (ddayValue === null) return '기타';
  if (ddayValue < 0) return '지난 항목';
  if (ddayValue <= 7) return '이번 주 확인할 것';
  if (ddayValue <= 30) return '이번 달';
  if (ddayValue <= 60) return '다음 달';
  return '그 이후';
}

const SECTION_ORDER = ['이번 주 확인할 것', '이번 달', '다음 달', '그 이후', '기타', '지난 항목'];

function TimeGroupedEvents({
  events,
  onUpdate,
  profile,
}: {
  events: TimelineEvent[];
  onUpdate: () => void;
  profile: ProfileContext;
}) {
  const sections = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const ddayValue = computeDdayValue(event, profile);
      const section = getTimeSection(ddayValue);
      if (!map.has(section)) map.set(section, []);
      map.get(section)!.push(event);
    }
    return SECTION_ORDER
      .filter(s => map.has(s))
      .map(s => ({ label: s, events: map.get(s)! }));
  }, [events, profile]);

  return (
    <div className="space-y-5">
      {sections.map(({ label, events: sectionEvents }) => (
        <div key={label}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{label}</h3>
          <div className="space-y-3">
            {sectionEvents.map((event) => {
              const ddayValue = computeDdayValue(event, profile);
              const isHero = ddayValue !== null && ddayValue >= 0 && ddayValue <= 7;
              return (
                <TimelineCard key={event.id} event={event} onUpdate={onUpdate} profile={profile} isHero={isHero} />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
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
  const [showOtherRegions, setShowOtherRegions] = useState(false);
  const [userRegionCity, setUserRegionCity] = useState<string | null>(null);
  const [userRegionProvince, setUserRegionProvince] = useState<string | null>(null);
  const [userDueDate, setUserDueDate] = useState<string | null>(null);
  const [userChildBirthDate, setUserChildBirthDate] = useState<string | null>(null);
  const hasTriedGenerate = useRef(false);

  useEffect(() => {
    async function loadProfile() {
      const [profileRes, childrenData] = await Promise.all([
        supabase.from('profiles').select('stage, due_date, pregnancy_start_date, region_province, region_city').eq('user_id', userId).single(),
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
      setUserRegionProvince(profile?.region_province || null);
      setUserRegionCity(profile?.region_city || null);
      setUserDueDate(profile?.due_date || targetChild?.due_date || null);
      setUserChildBirthDate(targetChild?.birth_date || null);

      // 현재 선택된 카테고리가 새 stage에서 유효하지 않으면 '전체'로 리셋
      const allowed = STAGE_CATEGORIES[ctx.stage] || ALL_CATEGORIES.map(c => c.key);
      setSelectedCategory(prev => allowed.includes(prev) ? prev : 'all');
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

  const { visibleEvents: sortedEvents, pastCount, otherRegionCount = 0 } = (() => {
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

    // 정부지원 지역 필터링: 내 지역 우선, 다른 지역은 토글로
    const regionFiltered = audienceFiltered.filter(({ event }) => {
      if (event.content?.category !== 'government_support') return true;
      if (showOtherRegions) return true;

      const c = event.content;
      // 전국 공통 (region_filter 없음) → 항상 표시
      if (!c.region_filter) return true;
      // 내 시/군/구 매칭 (region_city 비교, "시/구/군" 접미사 제거 후 비교)
      if (userRegionCity && c.region_city) {
        const normalizedProfile = userRegionCity.replace(/(특례시|광역시|특별시|특별자치시|시|군|구)$/, '');
        return c.region_city === normalizedProfile;
      }
      // region_city가 없으면 도 단위만 매칭 (구 시스템 호환)
      if (!c.region_city && c.region_filter === userRegionProvince) return true;
      return false;
    });

    if (selectedCategory === 'all') {
      let govCount = 0;
      const filtered = regionFiltered.filter(({ event }) => {
        if (event.content?.category === 'government_support') {
          govCount++;
          return govCount <= 5;
        }
        return true;
      });
      return { visibleEvents: filtered.map(s => s.event), pastCount: past.length };
    }
    // 다른 지역 콘텐츠 수 계산 (정부지원 탭에서만)
    const otherRegionCount = selectedCategory === 'government_support' && !showOtherRegions
      ? audienceFiltered.length - regionFiltered.length : 0;
    return { visibleEvents: regionFiltered.map(s => s.event), pastCount: past.length, otherRegionCount };
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
          {getCategoriesForStage(profileCtx.stage).map((cat) => (
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
              { key: 'all', label: '전체', icon: null },
              { key: 'baby', label: '아기', icon: Baby },
              { key: 'parent', label: '엄마아빠', icon: Users },
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
                {tab.icon && <tab.icon className="h-3 w-3 inline-block mr-0.5" />}{tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 지역 필터 (정부지원 탭) */}
      {selectedCategory === 'government_support' && userRegionCity && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">
              <MapPin className="h-3 w-3" />
              {userRegionCity}
            </span>
            {otherRegionCount > 0 && (
              <button
                onClick={() => setShowOtherRegions(!showOtherRegions)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showOtherRegions
                  ? `${userRegionCity}만 보기`
                  : `다른 ${userRegionProvince || ''} 지역 보기 (${otherRegionCount})`
                }
              </button>
            )}
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
        {/* 직장 탭: 출산 기간 계산기 (스크롤 영역 내부) */}
        {selectedCategory === 'work' && (
          <div className="mb-3 -mx-4">
            <WorkCalculator dueDate={userDueDate} childBirthDate={userChildBirthDate} />
          </div>
        )}

        {loading || generating ? (
          <CuteLoader text={generating ? '맞춤 콘텐츠를 준비하고 있어요...' : '로딩 중...'} />
        ) : sortedEvents.length === 0 ? (
          <FadeInUp>
            <div className="text-center py-12 space-y-3">
              <div className="flex justify-center mb-2">
                <EmptyStateIllustration type="no-timeline" />
              </div>
              <p className="text-base font-semibold text-gray-600">아직 타임라인이 없어요</p>
              <p className="text-sm text-gray-400">프로필 정보를 기반으로 맞춤 콘텐츠가 곧 제공됩니다</p>
            </div>
          </FadeInUp>
        ) : selectedCategory === 'work' ? (
          <WorkGroupedEvents events={sortedEvents} onUpdate={loadEvents} profile={profileCtx} />
        ) : (
          <TimeGroupedEvents events={sortedEvents} onUpdate={loadEvents} profile={profileCtx} />
        )}
      </div>
    </div>
  );
}
