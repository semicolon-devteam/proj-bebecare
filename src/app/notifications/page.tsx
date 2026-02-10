'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';
import { ChevronLeft, Bell, Baby, Briefcase, Building2, Megaphone } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string | null;
  status: string;
  sent_at: string;
  read_at: string | null;
}

const categoryIcons: Record<string, typeof Bell> = {
  '임신': Baby,
  '육아': Baby,
  '직장': Briefcase,
  '정부지원': Building2,
};

function getCategoryIcon(category: string | null) {
  if (!category) return Megaphone;
  return categoryIcons[category] || Megaphone;
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">알림</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 bg-surface">
        <div className="mx-auto max-w-3xl space-y-2">
          {notifications.length === 0 ? (
            <div className="card rounded-2xl p-12 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-600">아직 알림이 없어요</p>
              <p className="text-gray-400 mt-1 text-sm">새로운 소식이 오면 여기서 확인할 수 있어요</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const IconComp = getCategoryIcon(notif.category);
              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif)}
                  className={`w-full text-left card card-hover rounded-xl p-4 ${
                    !notif.read_at ? 'border-l-2 border-l-dusty-rose' : 'opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center">
                      <IconComp className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-bold truncate ${!notif.read_at ? 'text-gray-900' : 'text-gray-500'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(notif.sent_at)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${
                        expandedId === notif.id ? '' : 'line-clamp-2'
                      } ${!notif.read_at ? 'text-gray-600' : 'text-gray-400'}`}>
                        {notif.body}
                      </p>
                      {!notif.read_at && (
                        <div className="mt-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-dusty-rose" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
