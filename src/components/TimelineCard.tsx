'use client';

import { useState } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { markEventRead, toggleBookmark, dismissEvent } from '@/lib/timeline';
import { X, Star } from 'lucide-react';

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

  const dday = profile ? computeDday(event, profile) : null;

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
      onClick={handleExpand}
      className={`card card-hover overflow-hidden cursor-pointer ${
        !event.is_read ? 'border-l-2 border-l-dusty-rose' : ''
      }`}
    >
      {/* Category color bar */}
      <div className={`h-1 ${barColor}`} />

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
            <span className="text-xs font-semibold text-gray-500">
              {label}
            </span>
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

        <h3 className="mt-2 text-sm font-bold text-gray-900 leading-snug">
          {event.content?.title}
        </h3>

        {event.content?.summary && !expanded && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {event.content.summary}
          </p>
        )}
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {event.content?.body}
          </div>
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
