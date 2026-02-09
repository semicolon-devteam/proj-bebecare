export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

export async function POST(request: NextRequest) {
  try {
    initVapid();
    const supabaseAdmin = getSupabaseAdmin();

    // Admin check via service role key in header
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id, title, body, content_id, category, url } = await request.json();
    if (!user_id || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Create notification log
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id,
        title,
        body,
        content_id: content_id || null,
        category: category || null,
        status: 'sent',
      })
      .select()
      .single();

    if (notifError) {
      console.error('Error creating notification:', notifError);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    // Send push to all subscriptions
    const payload = JSON.stringify({ title, body, url: url || '/notifications' });
    let successCount = 0;
    let failCount = 0;

    await Promise.allSettled(
      (subscriptions || []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          successCount++;
        } catch (error: unknown) {
          failCount++;
          // Remove expired subscriptions (410 Gone)
          if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410) {
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      })
    );

    // Update status if all failed
    if (failCount > 0 && successCount === 0) {
      await supabaseAdmin
        .from('notifications')
        .update({ status: 'failed' })
        .eq('id', notification.id);
    }

    return NextResponse.json({
      success: true,
      notification_id: notification.id,
      sent: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
