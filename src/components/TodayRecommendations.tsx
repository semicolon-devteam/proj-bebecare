'use client';

import { useEffect, useState } from 'react';
import { getTimelineEvents, type TimelineEvent } from '@/lib/timeline';
import { getChildren, type Child } from '@/lib/children';
import { Calendar, AlertCircle, Info } from 'lucide-react';

interface TodayRecommendationsProps {
  userId: string;
}

interface ProfileContext {
  pregnancyStartDate?: Date;
  childBirthDate?: Date;
  children: Child[];
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

export default function TodayRecommendations({ userId }: TodayRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        // 프로필 정보 로드
        const children = await getChildren(userId);
        const profile: ProfileContext = { children };
        
        // 첫 번째 아이의 정보로 프로필 설정
        if (children.length > 0) {
          const child = children[0];
          if (child.due_date) {
            // 임신 중인 경우: 임신 시작일 계산 (출산예정일 - 280일)
            const dueDate = new Date(child.due_date);
            const pregnancyStart = new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
            profile.pregnancyStartDate = pregnancyStart;
          } else if (child.birth_date) {
            // 출산 후인 경우: 출생일 설정
            profile.childBirthDate = new Date(child.birth_date);
          }
        }

        // 미읽은 이벤트들 가져오기
        const events = await getTimelineEvents(userId, { 
          unreadOnly: false,  // 일단 모든 이벤트를 가져온 후 필터링
          limit: 50 
        });

        // 미읽음 및 미숨김 이벤트만 필터링
        const unreadEvents = events.filter(e => !e.is_read && !e.is_dismissed);

        // D-Day 계산 및 정렬
        const eventsWithDday = unreadEvents.map(event => ({
          ...event,
          ddayValue: computeDdayValue(event, profile)
        }));

        // D-Day 임박순으로 정렬 (null은 뒤로)
        eventsWithDday.sort((a, b) => {
          if (a.ddayValue === null && b.ddayValue === null) return 0;
          if (a.ddayValue === null) return 1;
          if (b.ddayValue === null) return -1;
          return a.ddayValue - b.ddayValue;
        });

        // 상위 3개 선택
        setRecommendations(eventsWithDday.slice(0, 3));
      } catch (error) {
        console.error('Error loading today recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [userId]);

  if (loading) return null;
  if (recommendations.length === 0) return null;

  const getDdayColor = (ddayValue: number | null): string => {
    if (ddayValue === null) return 'text-gray-500';
    if (ddayValue <= 3) return 'text-red-500';  // 🔴 D-3이내
    if (ddayValue <= 7) return 'text-amber-500'; // 🟡 D-7이내
    return 'text-gray-500'; // 🟢 참고
  };

  const getDdayIcon = (ddayValue: number | null) => {
    if (ddayValue === null) return <Info className="h-3 w-3" />;
    if (ddayValue <= 3) return <AlertCircle className="h-3 w-3" />;
    if (ddayValue <= 7) return <Calendar className="h-3 w-3" />;
    return <Info className="h-3 w-3" />;
  };

  const formatDday = (ddayValue: number | null): string => {
    if (ddayValue === null) return '';
    if (ddayValue === 0) return 'D-Day';
    if (ddayValue > 0) return `D-${ddayValue}`;
    return `D+${Math.abs(ddayValue)}`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700">오늘의 추천</h3>
      <div className="space-y-2">
        {recommendations.map((event) => {
          const ddayValue = (event as TimelineEvent & { ddayValue?: number | null }).ddayValue ?? null;
          const content = event.content;
          
          return (
            <div key={event.id} className="card p-0 overflow-hidden hover:bg-gray-50/50 transition-colors cursor-pointer">
              <div className="flex">
                <div className={`w-1 flex-shrink-0 rounded-l-xl ${ddayValue !== null && ddayValue <= 3 ? 'bg-red-300' : ddayValue !== null && ddayValue <= 7 ? 'bg-amber-300' : 'bg-dusty-rose-light'}`} />
                <div className="flex items-start justify-between gap-2 flex-1 p-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                    {content?.title || '제목 없음'}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {content?.summary || content?.body || '내용 없음'}
                  </p>
                </div>
                {ddayValue !== null && (
                  <div className={`flex items-center gap-1 ${getDdayColor(ddayValue)} flex-shrink-0`}>
                    {getDdayIcon(ddayValue)}
                    <span className="text-xs font-semibold">
                      {formatDday(ddayValue)}
                    </span>
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}