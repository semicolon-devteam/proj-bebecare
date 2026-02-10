'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X } from 'lucide-react';

/** Promise with timeout helper */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export default function PushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      setPermission(perm);
      if (perm === 'granted') {
        checkExistingSubscription();
      }
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await withTimeout(
        navigator.serviceWorker.ready,
        3000,
        'serviceWorker.ready'
      );
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch {
      setSubscribed(true);
    }
  };

  const subscribe = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      const registration = await withTimeout(
        navigator.serviceWorker.ready,
        5000,
        'serviceWorker.ready'
      );
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscribed(true);
        return;
      }

      await withTimeout(
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          }),
        }),
        5000,
        'push/subscribe API'
      );

      setSubscribed(true);
    } catch (error) {
      console.error('Push subscription error:', error);
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  if (subscribed || dismissed || typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  if (permission === 'denied') {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="card rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-dusty-rose flex-shrink-0" />
          <p className="text-sm text-gray-600">
            알림을 켜면 맞춤 육아 정보를 받을 수 있어요
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={subscribe}
            disabled={loading}
            className="rounded-lg bg-dusty-rose px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-dusty-rose-dark disabled:opacity-50 transition-colors"
          >
            {loading ? '처리중...' : '알림 허용'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
