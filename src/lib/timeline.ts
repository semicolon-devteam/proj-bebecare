import { supabase } from './supabase';

export interface TimelineEvent {
  id: string;
  content_id: string;
  display_date: string;
  is_read: boolean;
  is_dismissed: boolean;
  is_bookmarked: boolean;
  created_at: string;
  content: {
    id: string;
    category: string;
    subcategory: string | null;
    stage: string | null;
    title: string;
    body: string;
    summary: string | null;
    tags: string[] | null;
    priority: number;
    week_start: number | null;
    week_end: number | null;
    month_start: number | null;
    month_end: number | null;
    structured_data: Record<string, string> | null;
    target_audience: string | null;
  };
}

/**
 * 유저의 타임라인 이벤트 가져오기
 */
export async function getTimelineEvents(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    category?: string;
    unreadOnly?: boolean;
  }
): Promise<TimelineEvent[]> {
  let query = supabase
    .from('timeline_events')
    .select(`
      id, content_id, display_date, is_read, is_dismissed, is_bookmarked, created_at,
      content:contents(id, category, subcategory, stage, title, body, summary, tags, priority, week_start, week_end, month_start, month_end, structured_data, target_audience)
    `)
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('display_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching timeline:', error);
    return [];
  }

  // Filter by category on content level if specified
  let results = (data || []) as unknown as TimelineEvent[];
  if (options?.category) {
    results = results.filter(e => e.content?.category === options.category);
  }

  return results;
}

/**
 * 타임라인 이벤트 읽음 처리
 */
export async function markEventRead(eventId: string) {
  const { error } = await supabase
    .from('timeline_events')
    .update({ is_read: true })
    .eq('id', eventId);

  return !error;
}

/**
 * 타임라인 이벤트 북마크 토글
 */
export async function toggleBookmark(eventId: string, bookmarked: boolean) {
  const { error } = await supabase
    .from('timeline_events')
    .update({ is_bookmarked: bookmarked })
    .eq('id', eventId);

  return !error;
}

/**
 * 타임라인 이벤트 숨기기
 */
export async function dismissEvent(eventId: string) {
  const { error } = await supabase
    .from('timeline_events')
    .update({ is_dismissed: true })
    .eq('id', eventId);

  return !error;
}
