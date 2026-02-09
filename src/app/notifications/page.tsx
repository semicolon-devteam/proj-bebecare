'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string | null;
  status: string;
  sent_at: string;
  read_at: string | null;
}

const categoryIcons: Record<string, string> = {
  '임신': '🤰',
  '육아': '👶',
  '직장': '💼',
  '정부지원': '🏛️',
};

function getCategoryIcon(category: string | null): string {
  if (!category) return '📢';
  return categoryIcons[category] || '📢';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function NotificationsPage() {
  const router = useRouter();
  const [, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('sent_at', { ascending: false });

      if (!error && data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notif: Notification) => {
    if (expandedId === notif.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(notif.id);

    if (!notif.read_at) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString(), status: 'read' })
        .eq('id', notif.id);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read_at: new Date().toISOString(), status: 'read' } : n
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
      {/* Background */}
      <div className="absolute top-0 -left-4 h-72 w-72 animate-float rounded-full bg-gradient-to-br from-pink-400 to-rose-400 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 -right-4 h-72 w-72 animate-float rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 blur-3xl animation-delay-2000" />

      {/* Header */}
      <header className="relative z-10 bg-pink-500 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/20 transition-all"
            >
              ← 뒤로
            </button>
            <h1 className="text-xl font-black text-white">알림</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {notifications.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center animate-fade-in">
              <span className="text-6xl block mb-4">🔔</span>
              <p className="text-xl font-bold text-gray-700">아직 알림이 없어요</p>
              <p className="text-gray-500 mt-2">새로운 소식이 오면 여기서 확인할 수 있어요</p>
            </div>
          ) : (
            notifications.map((notif, index) => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif)}
                className={`w-full text-left glass rounded-2xl p-4 transition-all duration-300 hover-lift animate-slide-up ${
                  !notif.read_at ? 'border-l-4 border-l-blue-500' : 'opacity-80'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {getCategoryIcon(notif.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-bold truncate ${!notif.read_at ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(notif.sent_at)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      expandedId === notif.id ? '' : 'line-clamp-2'
                    } ${!notif.read_at ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notif.body}
                    </p>
                    {!notif.read_at && (
                      <div className="mt-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
