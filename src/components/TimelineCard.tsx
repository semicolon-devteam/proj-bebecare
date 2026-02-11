'use client';

import { useState } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { markEventRead, toggleBookmark, dismissEvent } from '@/lib/timeline';
import { X, Star, ChevronDown, ChevronUp } from 'lucide-react';

const categoryLabel: Record<string, string> = {
  pregnancy_planning: '임신 계획',
  pregnancy: '임신',
  postpartum: '산후',
  parenting: '육아',
  work: '직장',
  government_support: '정부 지원',
};

const categoryBarColor: Record<string, string> = {
  pregnancy_planning: 'bg-amber-500',
  pregnancy: 'bg-dusty-rose',
  postpartum: 'bg-purple-600',
  parenting: 'bg-cyan-600',
  work: 'bg-teal-600',
  government_support: 'bg-violet-600',
};

const categoryDotColor: Record<string, string> = {
  pregnancy_planning: 'bg-amber-500',
  pregnancy: 'bg-dusty-rose',
  postpartum: 'bg-purple-600',
  parenting: 'bg-cyan-600',
  work: 'bg-teal-600',
  government_support: 'bg-violet-600',
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
    if (num <= 30) return 'bg-amber-50 text-amber-600 border border-amber-200';
    return 'bg-gray-50 text-gray-500 border border-gray-200';
  }
  return 'bg-blue-50 text-blue-500 border border-blue-200';
}

// Key-value label icons for structured data
const structuredKeyIcon: Record<string, string> = {
  '발급처': '🏛️',
  '카드사': '💳',
  '지원금액': '💰',
  '사용처': '🛒',
  '발급기간': '📅',
  '특이사항': '💡',
  '대상': '👶',
};

function StructuredDataCard({ data, category }: { data: Record<string, string>; category: string }) {
  const bgColor = categoryBgColor[category] || 'bg-gray-50';
  const textColor = categoryTextColor[category] || 'text-gray-600';

  // Show 지원금액 prominently if available
  const amount = data['지원금액'];
  const otherEntries = Object.entries(data).filter(([k]) => k !== '지원금액');

  return (
    <div className="space-y-2">
      {amount && (
        <div className={`${bgColor} rounded-xl px-4 py-3 text-center`}>
          <p className="text-xs text-gray-500 mb-0.5">지원금액</p>
          <p className={`text-lg font-bold ${textColor}`}>{amount}</p>
        </div>
      )}
      <div className="grid gap-1.5">
        {otherEntries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm flex-shrink-0">{structuredKeyIcon[key] || '📌'}</span>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{key}</span>
              <p className="text-sm text-gray-700 leading-snug">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimelineCard({
  event,
  onUpdate,
  profile,
}: {
  event: TimelineEvent;
  onUpdate: () => void;
  profile?: ProfileContext;
}) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(event.is_bookmarked);

  const category = event.content?.category || 'pregnancy';
  const label = categoryLabel[category] || category;
  const barColor = categoryBarColor[category] || 'bg-gray-400';
  const dotColor = categoryDotColor[category] || 'bg-gray-400';
  const isGovernmentSupport = category === 'government_support';
  const hasStructuredData = isGovernmentSupport && event.content?.structured_data;

  // D-Day: compute or fallback to week_start/month_start label
  let dday = profile ? computeDday(event, profile) : null;
  if (!dday && event.content) {
    const c = event.content;
    if (c.week_start != null) dday = `${c.week_start}주`;
    else if (c.month_start != null) dday = `${c.month_start}개월`;
  }

  // Target audience badge
  const audience = event.content?.target_audience;
  const audienceLabel = audience === 'baby' ? '👶 아기' : audience === 'parent' ? '👨‍👩‍👧 부모' : null;

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

  return (
    <div
      className={`card overflow-hidden ${
        !event.is_read ? 'border-l-2 border-l-dusty-rose' : ''
      }`}
    >
      {/* Category color bar */}
      <div className={`h-1 ${barColor}`} />

      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
            <span className="text-xs font-semibold text-gray-500">
              {label}
            </span>
            {audienceLabel && (
              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">
                {audienceLabel}
              </span>
            )}
            {dday && (
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0 ${getDdayStyle(dday)}`}
              >
                {dday}
              </span>
            )}
            {!event.is_read && (
              <span className="h-1.5 w-1.5 rounded-full bg-dusty-rose flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={handleBookmark}
              className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {bookmarked ? (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              ) : (
                <Star className="h-4 w-4 text-gray-300" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4 text-gray-300 hover:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Title + Collapse toggle */}
        <div className="flex items-center justify-between mt-1.5">
          <h3 className="text-sm font-bold text-gray-900 leading-snug flex-1">
            {event.content?.title}
          </h3>
          <button
            onClick={handleExpand}
            className="p-1 ml-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* Summary always visible for government_support */}
        {hasStructuredData && event.content?.summary && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {event.content.summary}
          </p>
        )}
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Structured data card for government_support */}
          {hasStructuredData ? (
            <StructuredDataCard
              data={event.content!.structured_data!}
              category={category}
            />
          ) : (
            <>
              {event.content?.summary && (
                <p className="text-sm text-gray-500 mb-2">
                  {event.content.summary}
                </p>
              )}
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {event.content?.body}
              </div>
            </>
          )}
          {event.content?.tags && event.content.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.content.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-500"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
