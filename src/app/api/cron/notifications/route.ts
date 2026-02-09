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

/**
 * Vercel Cron: 매일 타임라인 체크리스트에서 알림 대상 찾아 Push 발송
 * D-7, D-3, D-0 (notification_days 기반)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    initVapid();
    const supabase = getSupabaseAdmin();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 미완료 타임라인 중 알림 대상 찾기
    const { data: timelines, error } = await supabase
      .from('timelines')
      .select('*')
      .eq('completed', false)
      .gte('scheduled_date', todayStr);

    if (error) {
      console.error('Error fetching timelines:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const timeline of timelines || []) {
      const scheduledDate = new Date(timeline.scheduled_date);
      const daysUntil = Math.floor(
        (scheduledDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      );

      // notification_days에 해당하는 날인지 확인
      const notificationDays: number[] = timeline.notification_days || [7, 3, 0];
      const alreadySent: number[] = timeline.notifications_sent || [];

      if (!notificationDays.includes(daysUntil) || alreadySent.includes(daysUntil)) {
        skippedCount++;
        continue;
      }

      // 유저의 push 구독 가져오기
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', timeline.user_id);

      if (!subscriptions || subscriptions.length === 0) {
        skippedCount++;
        continue;
      }

      // 알림 메시지 생성
      const daysText =
        daysUntil === 0 ? '오늘' : daysUntil === 1 ? '내일' : `${daysUntil}일 후`;
      const title = `📋 ${timeline.title}`;
      const body = `${daysText}까지! ${timeline.description || ''}`;

      // 알림 로그 저장
      await supabase.from('notifications').insert({
        user_id: timeline.user_id,
        title,
        body,
        category: timeline.category,
        status: 'sent',
      });

      // Push 발송
      const payload = JSON.stringify({
        title,
        body,
        url: '/',
      });

      await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch (err: unknown) {
            if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        })
      );

      // notifications_sent 업데이트
      await supabase
        .from('timelines')
        .update({
          notifications_sent: [...alreadySent, daysUntil],
        })
        .eq('id', timeline.id);

      sentCount++;
    }

    // 타임라인 이벤트 기반 알림 (새 콘텐츠 알림)
    // 오늘 생성된 읽지 않은 timeline_events에 대해 알림
    const { data: newEvents } = await supabase
      .from('timeline_events')
      .select(`
        id, user_id,
        content:contents(title, category, summary)
      `)
      .eq('display_date', todayStr)
      .eq('is_read', false);

    // 유저별로 그룹핑해서 하나의 알림으로
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
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (!subscriptions || subscriptions.length === 0) continue;

      const title = `📬 새로운 맞춤 정보 ${titles.length}건`;
      const body = titles.length <= 3
        ? titles.join(', ')
        : `${titles.slice(0, 2).join(', ')} 외 ${titles.length - 2}건`;

      await supabase.from('notifications').insert({
        user_id: userId,
        title,
        body,
        category: 'timeline',
        status: 'sent',
      });

      const payload = JSON.stringify({ title, body, url: '/' });
      await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush
            .sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
            .catch(() => {})
        )
      );

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      timelines_checked: timelines?.length || 0,
      notifications_sent: sentCount,
      skipped: skippedCount,
      new_content_users: Object.keys(userEvents).length,
    });
  } catch (error) {
    console.error('Notification cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
