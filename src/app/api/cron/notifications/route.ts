export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

let vapidInitialized = false;
function initVapid() {
  if (vapidInitialized) return;
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidInitialized = true;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Category message templates ──────────────────────────────────────
type Category = 'pregnancy_planning' | 'pregnancy' | 'postpartum' | 'parenting' | 'work' | 'government_support';

function ddayLabel(daysUntil: number): string {
  if (daysUntil === 0) return '오늘!';
  if (daysUntil <= 3) return `${daysUntil}일 후`;
  if (daysUntil <= 7) return '다음 주';
  return `D-${daysUntil}`;
}

function ddayKey(daysUntil: number): string {
  if (daysUntil === 0) return 'd0';
  if (daysUntil === 3) return 'd3';
  if (daysUntil === 7) return 'd7';
  return `d${daysUntil}`;
}

function buildCategoryMessage(
  category: string,
  title: string,
  daysUntil: number,
  weekStart: number | null
): { title: string; body: string } {
  const ddayText = ddayLabel(daysUntil);
  const urgencyPrefix = daysUntil === 0 ? '🔴 ' : daysUntil <= 3 ? '🟡 ' : '';

  switch (category as Category) {
    case 'pregnancy_planning':
      return {
        title: `${urgencyPrefix}🤰 ${title}`,
        body: ddayText === '오늘!' ? `오늘이에요! 지금 확인하세요.` : `${ddayText} — 미리 준비하세요!`,
      };
    case 'pregnancy':
      return {
        title: `${urgencyPrefix}👶 임신 ${weekStart ?? '?'}주차: ${title}`,
        body: ddayText === '오늘!' ? `해당 주차에 도달했어요!` : `${ddayText}에 해당 주차가 시작돼요.`,
      };
    case 'postpartum':
      return {
        title: `${urgencyPrefix}🍼 출산 후: ${title}`,
        body: ddayText === '오늘!' ? `오늘 확인할 내용이에요!` : `${ddayText} — 산후 관리 정보`,
      };
    case 'parenting':
      return {
        title: `${urgencyPrefix}👨‍👩‍👧 육아: ${title}`,
        body: ddayText === '오늘!' ? `오늘의 육아 정보를 확인하세요!` : `${ddayText} — 육아 알림`,
      };
    case 'work':
      return {
        title: `${urgencyPrefix}💼 직장맘 알림: ${title}`,
        body: ddayText === '오늘!' ? `오늘 처리해야 해요!` : `${ddayText} — 잊지 마세요!`,
      };
    case 'government_support':
      return {
        title: `${urgencyPrefix}🏛️ ${title}`,
        body: ddayText === '오늘!' ? `신청기한 오늘까지! 지금 신청하세요.` : `신청기한 ${ddayText}`,
      };
    default:
      return {
        title: `${urgencyPrefix}📋 ${title}`,
        body: `${ddayText}`,
      };
  }
}

// ── Push helper ─────────────────────────────────────────────────────
async function sendPushToUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  notification: { title: string; body: string },
  url = '/'
) {
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (!subscriptions || subscriptions.length === 0) return false;

  const payload = JSON.stringify({ title: notification.title, body: notification.body, url });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'statusCode' in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    })
  );

  // Log notification
  await supabase.from('notifications').insert({
    user_id: userId,
    title: notification.title,
    body: notification.body,
    category: 'timeline_event',
    status: 'sent',
  });

  return true;
}

// ── Main handler ────────────────────────────────────────────────────
const NOTIFICATION_DAYS = [7, 3, 0];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    initVapid();
    const supabase = getSupabaseAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    let sentCount = 0;
    let skippedCount = 0;

    // ═══════════════════════════════════════════════════════════════
    // Part 1: timelines 테이블 기반 D-day 알림 (기존 로직 유지)
    // ═══════════════════════════════════════════════════════════════
    const { data: timelines, error } = await supabase
      .from('timelines')
      .select('*')
      .eq('completed', false)
      .gte('scheduled_date', todayStr);

    if (error) {
      console.error('Error fetching timelines:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const timeline of timelines || []) {
      const scheduledDate = new Date(timeline.scheduled_date);
      const daysUntil = Math.floor(
        (scheduledDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      );

      const notificationDays: number[] = timeline.notification_days || [7, 3, 0];
      const alreadySent: number[] = timeline.notifications_sent || [];

      if (!notificationDays.includes(daysUntil) || alreadySent.includes(daysUntil)) {
        skippedCount++;
        continue;
      }

      const msg = buildCategoryMessage(
        timeline.category || 'pregnancy',
        timeline.title,
        daysUntil,
        null
      );

      const didSend = await sendPushToUser(supabase, timeline.user_id, msg);
      if (!didSend) {
        skippedCount++;
        continue;
      }

      await supabase
        .from('timelines')
        .update({ notifications_sent: [...alreadySent, daysUntil] })
        .eq('id', timeline.id);

      sentCount++;
    }

    // ═══════════════════════════════════════════════════════════════
    // Part 2: timeline_events + contents.week_start 기반 D-day 알림
    // ═══════════════════════════════════════════════════════════════
    // Get all undismissed timeline_events with content that has week_start or month_start
    const { data: events } = await supabase
      .from('timeline_events')
      .select(`
        id, user_id, notifications_sent,
        content:contents(id, title, category, week_start, week_end, month_start, month_end, summary)
      `)
      .eq('is_dismissed', false);

    if (events && events.length > 0) {
      // Collect unique user_ids to fetch profiles
      const userIds = [...new Set(events.map((e) => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, pregnancy_start_date, birth_date')
        .in('user_id', userIds);

      const profileMap = new Map<string, { pregnancy_start_date: string | null; birth_date: string | null }>();
      for (const p of profiles || []) {
        profileMap.set(p.user_id, p);
      }

      for (const event of events) {
        const content = event.content as unknown as {
          id: string;
          title: string;
          category: string;
          week_start: number | null;
          week_end: number | null;
          month_start: number | null;
          month_end: number | null;
          summary: string | null;
        } | null;
        if (!content) continue;

        const profile = profileMap.get(event.user_id);
        if (!profile) continue;

        // Calculate target date
        let targetDate: Date | null = null;

        if (content.week_start != null && profile.pregnancy_start_date) {
          targetDate = new Date(profile.pregnancy_start_date);
          targetDate.setDate(targetDate.getDate() + content.week_start * 7);
        } else if (content.month_start != null && profile.birth_date) {
          targetDate = new Date(profile.birth_date);
          targetDate.setMonth(targetDate.getMonth() + content.month_start);
        }

        if (!targetDate) continue;

        targetDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.round(
          (targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Check if this is a notification day
        if (!NOTIFICATION_DAYS.includes(daysUntil)) continue;

        // Check if already sent for this D-day
        const alreadySent: Record<string, boolean> = event.notifications_sent || {};
        const key = ddayKey(daysUntil);
        if (alreadySent[key]) {
          skippedCount++;
          continue;
        }

        const msg = buildCategoryMessage(
          content.category,
          content.title,
          daysUntil,
          content.week_start
        );

        const didSend = await sendPushToUser(supabase, event.user_id, msg);
        if (!didSend) {
          skippedCount++;
          continue;
        }

        // Mark as sent
        await supabase
          .from('timeline_events')
          .update({
            notifications_sent: { ...alreadySent, [key]: true },
          })
          .eq('id', event.id);

        sentCount++;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // Part 3: 오늘 display_date인 새 콘텐츠 묶음 알림 (기존 유지)
    // ═══════════════════════════════════════════════════════════════
    const { data: newEvents } = await supabase
      .from('timeline_events')
      .select(`
        id, user_id,
        content:contents(title, category, summary)
      `)
      .eq('display_date', todayStr)
      .eq('is_read', false);

    const userEvents: Record<string, { titles: string[]; userId: string }> = {};
    for (const event of newEvents || []) {
      const content = event.content as unknown as { title: string; category: string; summary: string } | null;
      if (!content) continue;
      if (!userEvents[event.user_id]) {
        userEvents[event.user_id] = { titles: [], userId: event.user_id };
      }
      userEvents[event.user_id].titles.push(content.title);
    }

    for (const [userId, { titles }] of Object.entries(userEvents)) {
      const title = `📬 새로운 맞춤 정보 ${titles.length}건`;
      const body =
        titles.length <= 3
          ? titles.join(', ')
          : `${titles.slice(0, 2).join(', ')} 외 ${titles.length - 2}건`;

      await sendPushToUser(supabase, userId, { title, body });
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      timelines_checked: timelines?.length || 0,
      timeline_events_checked: events?.length || 0,
      notifications_sent: sentCount,
      skipped: skippedCount,
      new_content_users: Object.keys(userEvents).length,
    });
  } catch (error) {
    console.error('Notification cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
