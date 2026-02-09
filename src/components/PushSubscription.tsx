'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        checkExistingSubscription();
      }
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch {
      // ignore
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

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/push/subscribe', {
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
      });

      setSubscribed(true);
    } catch (error) {
      console.error('Push subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Already subscribed or not supported
  if (subscribed || typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  // Denied
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
        <button
          onClick={subscribe}
          disabled={loading}
          className="flex-shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-bold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
        >
          {loading ? '...' : '알림 허용'}
        </button>
      </div>
    </div>
  );
}
