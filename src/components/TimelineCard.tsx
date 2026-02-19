'use client';

import { useState } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { markEventRead, toggleBookmark, dismissEvent } from '@/lib/timeline';
import { X, Star, ChevronDown, ChevronUp, Coins, Landmark, CreditCard, Calendar, Lightbulb, Baby, Pin, Users } from 'lucide-react';

const categoryLabel: Record<string, string> = {
  pregnancy_planning: '임신 계획',
  pregnancy: '임신',
  postpartum: '산후',
  parenting: '육아',
  work: '직장',
  government_support: '정부 지원',
};

const categoryIconBg: Record<string, string> = {
  pregnancy_planning: 'bg-amber-100 text-amber-600',
  pregnancy: 'bg-pink-100 text-pink-600',
  postpartum: 'bg-purple-100 text-purple-600',
  parenting: 'bg-cyan-100 text-cyan-600',
  work: 'bg-teal-100 text-teal-600',
  government_support: 'bg-violet-100 text-violet-600',
};

const categoryBgColor: Record<string, string> = {
  pregnancy_planning: 'bg-amber-50',
  pregnancy: 'bg-pink-50',
  postpartum: 'bg-purple-50',
  parenting: 'bg-cyan-50',
  work: 'bg-teal-50',
  government_support: 'bg-violet-50',
};

const categoryTextColor: Record<string, string> = {
  pregnancy_planning: 'text-amber-500',
  pregnancy: 'text-dusty-rose',
  postpartum: 'text-purple-600',
  parenting: 'text-cyan-600',
  work: 'text-teal-600',
  government_support: 'text-violet-600',
};

const categoryGradient: Record<string, string> = {
  pregnancy_planning: 'from-amber-50 to-orange-50',
  pregnancy: 'from-pink-50 to-rose-50',
  postpartum: 'from-purple-50 to-fuchsia-50',
  parenting: 'from-cyan-50 to-teal-50',
  work: 'from-teal-50 to-emerald-50',
  government_support: 'from-violet-50 to-purple-50',
};

import { Shield, Heart, BookOpen, ClipboardList } from 'lucide-react';

const categoryIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  pregnancy_planning: Calendar,
  pregnancy: Heart,
  postpartum: Shield,
  parenting: Baby,
  work: ClipboardList,
  government_support: Coins,
};

export interface ProfileContext {
  stage: string;
  currentWeek?: number;
  ageMonths?: number;
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
}

function formatDday(diffDays: number): string {
  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return 'D-Day';
  return `D+${Math.abs(diffDays)}`;
}

function diffFromToday(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return Math.round((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function computeDday(event: TimelineEvent, profile: ProfileContext): string | null {
  const c = event.content;
  if (!c) return null;
  if (c.week_start != null && profile.pregnancyStartDate) {
    const contentDate = new Date(profile.pregnancyStartDate.getTime() + c.week_start * 7 * 24 * 60 * 60 * 1000);
    return formatDday(diffFromToday(contentDate));
  }
  if (c.month_start != null && profile.childBirthDate) {
    const contentDate = new Date(profile.childBirthDate);
    contentDate.setMonth(contentDate.getMonth() + c.month_start);
    return formatDday(diffFromToday(contentDate));
  }
  return null;
}

function getDdayStyle(dday: string): string {
  if (dday === 'D-Day') return 'bg-red-50 text-red-600 border border-red-200';
  if (dday.startsWith('D-')) {
    const num = parseInt(dday.slice(2));
    if (num <= 7) return 'bg-orange-50 text-orange-600 border border-orange-200';
    if (num <= 14) return 'bg-amber-50 text-amber-600 border border-amber-200';
    return 'bg-gray-50 text-gray-500 border border-gray-200';
  }
  if (dday.startsWith('D+')) return 'bg-blue-50 text-blue-500 border border-blue-200';
  return 'bg-gray-50 text-gray-400 border border-gray-100';
}

// Key-value label icons for structured data
const structuredKeyIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '발급처': Landmark,
  '카드사': CreditCard,
  '지원금액': Coins,
  '발급기간': Calendar,
  '특이사항': Lightbulb,
  '대상': Baby,
};
const defaultStructuredIcon = Pin;

function StructuredDataCard({ data, category }: { data: Record<string, string>; category: string }) {
  const bgColor = categoryBgColor[category] || 'bg-gray-50';
  const textColor = categoryTextColor[category] || 'text-gray-600';
  const amount = data['지원금액'];
  const otherEntries = Object.entries(data).filter(([k]) => k !== '지원금액');

  return (
    <div className="space-y-2">
      {amount && (
        <div className={`${bgColor} rounded-[1.25rem] px-4 py-3 text-center`}>
          <p className="text-xs text-gray-500 mb-0.5">지원금액</p>
          <p className={`text-lg font-bold ${textColor}`}>{amount}</p>
        </div>
      )}
      <div className="grid gap-1.5">
        {otherEntries.map(([key, value]) => {
          const IconComp = structuredKeyIconMap[key] || defaultStructuredIcon;
          return (
            <div key={key} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconComp className="h-3 w-3 text-gray-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{key}</span>
                <p className="text-sm text-gray-700 leading-snug">{value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TimelineCard({
  event,
  onUpdate,
  profile,
  isHero,
}: {
  event: TimelineEvent;
  onUpdate: () => void;
  profile?: ProfileContext;
  isHero?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(event.is_bookmarked);

  const category = event.content?.category || 'pregnancy';
  const label = categoryLabel[category] || category;
  const iconBg = categoryIconBg[category] || 'bg-gray-100 text-gray-500';
  const isGovernmentSupport = category === 'government_support';
  const hasStructuredData = isGovernmentSupport && event.content?.structured_data;
  const CategoryIconComp = categoryIcon[category] || ClipboardList;

  let dday: string | null = null;
  if (profile) {
    const rawDday = computeDday(event, profile);
    if (rawDday) {
      const match = rawDday.match(/^D-(\d+)$/);
      if (match) {
        const days = parseInt(match[1]);
        if (days <= 14) {
          dday = rawDday;
        } else {
          const c = event.content;
          if (c?.week_start != null) dday = `${c.week_start}주`;
          else if (c?.month_start != null) dday = `${c.month_start}개월`;
        }
      } else {
        dday = rawDday;
      }
    }
  }
  if (!dday && event.content) {
    const c = event.content;
    if (c.week_start != null) dday = `${c.week_start}주`;
    else if (c.month_start != null) dday = `${c.month_start}개월`;
  }

  const audience = event.content?.target_audience;

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!event.is_read) {
      await markEventRead(event.id);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !bookmarked;
    setBookmarked(newVal);
    await toggleBookmark(event.id, newVal);
  };

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await dismissEvent(event.id);
    onUpdate();
  };

  // Hero card style for urgent items
  if (isHero) {
    const gradient = categoryGradient[category] || 'from-gray-50 to-gray-100';
    return (
      <div className={`rounded-[1.25rem] bg-gradient-to-br ${gradient} border border-white/60 shadow-[var(--shadow-warm)] overflow-hidden ${!event.is_read ? 'ring-2 ring-dusty-rose/20' : ''}`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <CategoryIconComp className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-500">{label}</span>
                  {audience === 'baby' && <Baby className="h-3 w-3 text-gray-400" aria-hidden="true" />}
                  {audience === 'parent' && <Users className="h-3 w-3 text-gray-400" aria-hidden="true" />}
                  {dday && (
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getDdayStyle(dday)}`}>
                      {dday}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">{event.content?.title}</h3>
                {event.content?.summary && (
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{event.content.summary}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={handleBookmark} aria-label="북마크" className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                {bookmarked ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" aria-hidden="true" /> : <Star className="h-4 w-4 text-gray-300" aria-hidden="true" />}
              </button>
              <button onClick={handleDismiss} aria-label="닫기" className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                <X className="h-4 w-4 text-gray-300 hover:text-gray-500" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Amount highlight for government support */}
          {hasStructuredData && event.content?.structured_data?.['지원금액'] && (
            <div className="mt-3 rounded-xl bg-white/60 px-4 py-2.5 text-center">
              <p className={`text-lg font-bold ${categoryTextColor[category] || 'text-gray-700'}`}>
                {event.content.structured_data['지원금액']}
              </p>
            </div>
          )}

          <button onClick={handleExpand} className="mt-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            {expanded ? '접기' : '자세히 보기'}
          </button>
        </div>

        {expanded && (
          <div className="px-5 pb-5 pt-0">
            {hasStructuredData ? (
              <StructuredDataCard data={event.content!.structured_data!} category={category} />
            ) : (
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{event.content?.body}</div>
            )}
            {event.content?.tags && event.content.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {event.content.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-white/80 border border-gray-200 px-2 py-0.5 text-xs text-gray-500">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Compact card (default)
  return (
    <div className={`rounded-[1.25rem] bg-white border border-gray-100 shadow-[var(--shadow-warm)] overflow-hidden ${!event.is_read ? 'ring-1 ring-dusty-rose/20' : ''}`}>
      <div className="p-4 flex gap-3">
        {/* Left icon circle */}
        <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <CategoryIconComp className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-semibold text-gray-500">{label}</span>
              {audience === 'baby' && <Baby className="h-3 w-3 text-gray-400" aria-hidden="true" />}
              {audience === 'parent' && <Users className="h-3 w-3 text-gray-400" aria-hidden="true" />}
              {dday && (
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0 ${getDdayStyle(dday)}`}>
                  {dday}
                </span>
              )}
              {!event.is_read && <span className="h-1.5 w-1.5 rounded-full bg-dusty-rose flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={handleBookmark} aria-label="북마크" className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                {bookmarked ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" aria-hidden="true" /> : <Star className="h-4 w-4 text-gray-300" aria-hidden="true" />}
              </button>
              <button onClick={handleDismiss} aria-label="닫기" className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="h-4 w-4 text-gray-300 hover:text-gray-500" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <h3 className="text-sm font-bold text-gray-900 leading-snug flex-1">{event.content?.title}</h3>
            <button onClick={handleExpand} aria-label={expanded ? '접기' : '펼치기'} className="p-1 ml-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />}
            </button>
          </div>

          {/* Amount highlight for government support */}
          {isGovernmentSupport && event.content?.structured_data?.['지원금액'] && (
            <p className={`text-sm font-bold mt-1 ${categoryTextColor[category]}`}>
              {event.content.structured_data['지원금액']}
            </p>
          )}

          {hasStructuredData && event.content?.summary && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{event.content.summary}</p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 ml-12">
          {hasStructuredData ? (
            <StructuredDataCard data={event.content!.structured_data!} category={category} />
          ) : (
            <>
              {event.content?.summary && <p className="text-sm text-gray-500 mb-2">{event.content.summary}</p>}
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{event.content?.body}</div>
            </>
          )}
          {event.content?.tags && event.content.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.content.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-500">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
