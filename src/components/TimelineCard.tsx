'use client';

import { useState } from 'react';
import type { TimelineEvent } from '@/lib/timeline';
import { markEventRead, toggleBookmark, dismissEvent } from '@/lib/timeline';

const categoryEmoji: Record<string, string> = {
  pregnancy_planning: '📋',
  pregnancy: '🤰',
  postpartum: '🤱',
  parenting: '👶',
  work: '💼',
  government_support: '🏛️',
};

const categoryLabel: Record<string, string> = {
  pregnancy_planning: '임신 계획',
  pregnancy: '임신',
  postpartum: '산후',
  parenting: '육아',
  work: '직장',
  government_support: '정부 지원',
};

const categoryColor: Record<string, string> = {
  pregnancy_planning: 'from-amber-400 to-orange-500',
  pregnancy: 'from-pink-400 to-rose-500',
  postpartum: 'from-purple-400 to-indigo-500',
  parenting: 'from-blue-400 to-cyan-500',
  work: 'from-emerald-400 to-teal-500',
  government_support: 'from-violet-400 to-purple-500',
};

export interface ProfileContext {
  stage: string;
  currentWeek?: number;
  ageMonths?: number;
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
}

function computeDday(event: TimelineEvent, profile: ProfileContext): string | null {
  const c = event.content;
  if (!c) return null;

  // 임신 콘텐츠: week_start 기반
  if (c.stage === 'pregnant' && c.week_start !== null && profile.pregnancyStartDate) {
    // 해당 콘텐츠의 시작 날짜 = 임신 시작일 + week_start * 7일
    const contentStartDate = new Date(profile.pregnancyStartDate.getTime() + c.week_start * 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contentStartDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((contentStartDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays > 0) return `D-${diffDays}`;
    if (diffDays === 0) return 'D-Day';
    return `D+${Math.abs(diffDays)}`;
  }

  // 산후/육아 콘텐츠: month_start 기반
  if ((c.stage === 'postpartum' || c.stage === 'parenting') && c.month_start !== null && profile.childBirthDate) {
    const contentStartDate = new Date(profile.childBirthDate);
    contentStartDate.setMonth(contentStartDate.getMonth() + c.month_start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contentStartDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((contentStartDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays > 0) return `D-${diffDays}`;
    if (diffDays === 0) return 'D-Day';
    return `D+${Math.abs(diffDays)}`;
  }

  // week 기반 산후 콘텐츠
  if (c.stage === 'postpartum' && c.week_start !== null && profile.childBirthDate) {
    const contentStartDate = new Date(profile.childBirthDate.getTime() + c.week_start * 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contentStartDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((contentStartDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays > 0) return `D-${diffDays}`;
    if (diffDays === 0) return 'D-Day';
    return `D+${Math.abs(diffDays)}`;
  }

  return null;
}

function getDdayColor(dday: string): string {
  if (dday === 'D-Day') return 'bg-red-500 text-white';
  if (dday.startsWith('D-')) {
    const num = parseInt(dday.slice(2));
    if (num <= 7) return 'bg-orange-500 text-white';
    if (num <= 30) return 'bg-amber-500 text-white';
    return 'bg-gray-400 text-white';
  }
  // D+ (past)
  return 'bg-blue-400 text-white';
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
  const emoji = categoryEmoji[category] || '📌';
  const label = categoryLabel[category] || category;
  const color = categoryColor[category] || 'from-gray-400 to-gray-500';

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
      className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover-lift ${
        !event.is_read ? 'border-l-4 border-l-blue-500' : ''
      }`}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${color} px-2.5 py-0.5 text-xs font-bold text-white flex-shrink-0`}
            >
              {emoji} {label}
            </span>
            {dday && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold flex-shrink-0 ${getDdayColor(dday)}`}
              >
                {dday}
              </span>
            )}
            {!event.is_read && (
              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleBookmark}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
            >
              {bookmarked ? '⭐' : '☆'}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <h3 className="mt-2 text-base font-bold text-gray-800 leading-snug">
          {event.content?.title}
        </h3>

        {event.content?.summary && !expanded && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {event.content.summary}
          </p>
        )}
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {event.content?.body}
          </div>
          {event.content?.tags && event.content.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.content.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
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
