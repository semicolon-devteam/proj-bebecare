'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Bell, User as UserIcon, Baby, Droplets, Moon, Shirt, Bath, Pill } from 'lucide-react';
import ChecklistCard from '@/components/ChecklistCard';
import OnboardingGuide from '@/components/OnboardingGuide';
import { FadeInUp } from '@/components/animations/MotionWrappers';

interface HomeDashboardProps {
  user: { id: string; email?: string };
}

export default function HomeDashboard({ user }: HomeDashboardProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickLogType, setQuickLogType] = useState<LogType | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { startTimer } = useTimer();

  useEffect(() => {
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null)
      .then(({ count }) => setUnreadCount(count || 0));

    getChildren(user.id).then((kids) => {
      if (kids.length > 0) setSelectedChildId(kids[0].id);
    });
  }, [user.id]);

  const quickLogItems: [LogType, React.ComponentType<{ className?: string }>, string, string][] = [
    ['formula', Baby, '분유', 'bg-orange-50 text-orange-400'],
    ['breast', Droplets, '모유', 'bg-pink-50 text-pink-400'],
    ['sleep', Moon, '수면', 'bg-indigo-50 text-indigo-400'],
    ['diaper', Shirt, '기저귀', 'bg-amber-50 text-amber-400'],
    ['bath', Bath, '목욕', 'bg-cyan-50 text-cyan-400'],
    ['medicine', Pill, '투약', 'bg-emerald-50 text-emerald-400'],
  ];

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border backdrop-blur-sm px-4 py-3" style={{ backgroundColor: 'rgba(255, 249, 245, 0.95)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-bold text-dusty-rose" style={{ letterSpacing: '0.05em', fontWeight: 700 }}>
            BebeCare
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push('/notifications')}
              className="relative rounded-full p-2 text-gray-400 hover:text-dusty-rose hover:bg-dusty-rose/5 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-dusty-rose text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/mypage')}
              className="rounded-full p-2 text-gray-400 hover:text-dusty-rose hover:bg-dusty-rose/5 transition-colors"
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" style={{ backgroundColor: '#FEF7F2' }}>
        <div className="mx-auto max-w-4xl space-y-6">
          <FadeInUp delay={0}>
            <div data-tour="baby-profile">
              <BabyProfileCard userId={user.id} />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.05}>
            <div data-tour="today-summary">
              <TodaySummary userId={user.id} refreshKey={refreshKey} />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div data-tour="recommendations">
              <TodayRecommendations userId={user.id} />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div data-tour="checklist">
              <ChecklistCard userId={user.id} />
            </div>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <div className="space-y-3" data-tour="quick-log">
              <h3 className="text-sm font-bold text-gray-700">퀵 기록</h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {quickLogItems.map(([type, Icon, label, colorClass]) => (
                  <button
                    key={type}
                    onClick={() => setQuickLogType(type)}
                    className="flex items-center gap-2 flex-shrink-0 rounded-full bg-white border border-border pl-2.5 pr-4 py-2 hover:shadow-md transition-all"
                  >
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </FadeInUp>
        </div>
      </div>

      <OnboardingGuide />

      {quickLogType && (
        <QuickLogModal
          userId={user.id}
          childId={selectedChildId}
          logType={quickLogType}
          onClose={() => setQuickLogType(null)}
          onStartTimer={(type) => { startTimer(type, user.id, selectedChildId); setQuickLogType(null); }}
          onSaved={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  );
}
