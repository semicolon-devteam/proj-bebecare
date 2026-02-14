'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isOnboardingCompleted } from '@/lib/profile';
import type { User } from '@supabase/supabase-js';
import PushSubscription from '@/components/PushSubscription';
import QuickLogModal from '@/components/QuickLogModal';
import BabyProfileCard from '@/components/BabyProfileCard';
import TodaySummary from '@/components/TodaySummary';
import TodayRecommendations from '@/components/TodayRecommendations';
import { supabase } from '@/lib/supabase';
import { type LogType } from '@/lib/baby-logs';
import { getChildren } from '@/lib/children';
import { useTimer } from '@/components/Timer';
import { Bell, User as UserIcon } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickLogType, setQuickLogType] = useState<LogType | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { startTimer } = useTimer();

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null)
        .then(({ count }) => setUnreadCount(count || 0));
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const completed = await isOnboardingCompleted(currentUser.id);
        if (!completed) {
          router.push('/onboarding');
          return;
        }
      }
      setUser(currentUser);
      if (currentUser) {
        const kids = await getChildren(currentUser.id);
        if (kids.length > 0) setSelectedChildId(kids[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {user ? (
        <div className="flex h-[100dvh] flex-col">
          {/* Minimal Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <h1 className="text-xl font-semibold text-dusty-rose tracking-tight">
                BebeCare
              </h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push('/notifications')}
                  className="relative rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/mypage')}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Push Subscription */}
          <div className="pt-2">
            <PushSubscription />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-surface">
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Baby Profile Card */}
              <BabyProfileCard userId={user.id} />

              {/* Today's Summary */}
              <TodaySummary userId={user.id} />

              {/* Today's Recommendations */}
              <TodayRecommendations userId={user.id} />

              {/* Quick Log Bar */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">퀵 기록</h3>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {([
                    ['formula', '🍼', '분유'],
                    ['breast', '🤱', '모유'],
                    ['sleep', '😴', '수면'],
                    ['diaper', '🧷', '기저귀'],
                    ['bath', '🛁', '목욕'],
                    ['medicine', '💊', '투약']
                  ] as [LogType, string, string][]).map(([type, emoji, label]) => (
                    <button
                      key={type}
                      onClick={() => setQuickLogType(type)}
                      className="flex items-center gap-2 flex-shrink-0 rounded-xl bg-white border border-gray-200 pl-3 pr-4 py-2.5 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <span className="text-lg">{emoji}</span>
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Log Modal */}
          {quickLogType && (
            <QuickLogModal
              userId={user.id}
              childId={selectedChildId}
              logType={quickLogType}
              onClose={() => setQuickLogType(null)}
              onStartTimer={(type) => { startTimer(type, user.id, selectedChildId); setQuickLogType(null); }}
            />
          )}
        </div>
      ) : (
        /* Landing Page */
        <div className="flex min-h-screen items-center justify-center px-5 py-8">
          <div className="w-full max-w-lg space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="card rounded-2xl px-6 py-8">
                <h1 className="text-4xl md:text-5xl font-bold text-dusty-rose">
                  BebeCare
                </h1>
                <p className="mt-2 text-lg font-semibold text-gray-800">
                  임신·출산·육아 슈퍼앱
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  AI 기반 맞춤 정보 제공 서비스
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <div className="card rounded-2xl p-6 text-center">
                <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                  BebeCare와 함께
                  <br />
                  <span className="text-xl font-bold text-dusty-rose">
                    행복한 임신·출산·육아
                  </span>
                  <br />
                  를 시작하세요
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="rounded-xl bg-dusty-rose px-6 py-4 font-semibold text-white shadow-sm hover:bg-dusty-rose-dark transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="card rounded-xl px-6 py-4 font-semibold text-dusty-rose card-hover"
                >
                  회원가입
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
