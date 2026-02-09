'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
      // SW not ready or no subscription — hide banner for granted users
      // (이미 permission granted인데 SW 문제면 배너 안 보여줌)
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
        setSubscribed(true); // permission granted면 배너 숨김
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
      // 에러 시에도 배너 숨김 (무한 로딩 방지)
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  // Already subscribed, dismissed, or not supported
  if (subscribed || dismissed || typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  // Denied or already granted (but SW issue)
  if (permission === 'denied') {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 animate-slide-down">
      <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <p className="text-sm font-medium text-gray-700">
            알림을 켜면 맞춤 육아 정보를 받을 수 있어요
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={subscribe}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
          >
            {loading ? '처리중...' : '알림 허용'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
