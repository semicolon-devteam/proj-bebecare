'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getChildren, deriveStageFromChildren } from '@/lib/children';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Heart, Building2, Syringe, Baby } from 'lucide-react';
import { CuteLoader } from '@/components/animations/MotionWrappers';
import TimelineFeed from '@/components/TimelineFeed';
import BenefitsTab from '@/components/BenefitsTab';
import VaccinationTab from '@/components/VaccinationTab';
import PregnancyWeeksTab from '@/components/PregnancyWeeksTab';

type ExploreTab = 'custom' | 'benefits' | 'vaccination' | 'pregnancy';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ExploreTab>('custom');
  const [userStage, setUserStage] = useState<string>('planning');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // 사용자 stage 확인
        const children = await getChildren(currentUser.id);
        const stage = deriveStageFromChildren(children);
        setUserStage(stage);

        // URL 파라미터에서 탭 확인
        const tab = searchParams.get('tab') as ExploreTab;
        if (tab && isValidTab(tab, stage)) {
          setActiveTab(tab);
        } else {
          setActiveTab('custom'); // 기본 탭
        }
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router, searchParams]);

  const isValidTab = (tab: ExploreTab, stage: string): boolean => {
    const stageTabMap: Record<string, ExploreTab[]> = {
      planning: ['custom', 'benefits'],
      pregnant: ['custom', 'pregnancy', 'benefits', 'vaccination'],
      postpartum: ['custom', 'benefits', 'vaccination'],
      parenting: ['custom', 'benefits', 'vaccination'],
    };
    return stageTabMap[stage]?.includes(tab) ?? false;
  };

  const getAvailableTabs = (stage: string) => {
    const tabs = [
      { key: 'custom' as ExploreTab, label: '맞춤', icon: Heart },
      { key: 'benefits' as ExploreTab, label: '정부지원', icon: Building2 },
      { key: 'vaccination' as ExploreTab, label: '예방접종', icon: Syringe },
      { key: 'pregnancy' as ExploreTab, label: '임신주수', icon: Baby },
    ];

    const stageTabMap: Record<string, ExploreTab[]> = {
      planning: ['custom', 'benefits'],
      pregnant: ['custom', 'pregnancy', 'benefits', 'vaccination'],
      postpartum: ['custom', 'benefits', 'vaccination'],
      parenting: ['custom', 'benefits', 'vaccination'],
    };

    const allowedTabs = stageTabMap[stage] || ['custom', 'benefits'];
    return tabs.filter(tab => allowedTabs.includes(tab.key));
  };

  const handleTabChange = (tab: ExploreTab) => {
    setActiveTab(tab);
    // URL 업데이트
    const newUrl = `/explore${tab !== 'custom' ? `?tab=${tab}` : ''}`;
    router.replace(newUrl);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <CuteLoader />
      </div>
    );
  }

  const availableTabs = getAvailableTabs(userStage);

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
            정보
          </h1>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-border bg-white px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          {availableTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex items-center gap-1.5 flex-shrink-0 py-3 px-4 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === key
                  ? 'border-dusty-rose text-dusty-rose'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-surface pb-24">
        {activeTab === 'custom' && user && (
          <div className="h-full">
            <TimelineFeed userId={user.id} />
          </div>
        )}
        
        {activeTab === 'benefits' && user && (
          <div className="h-full">
            <BenefitsTab userId={user.id} />
          </div>
        )}

        {activeTab === 'vaccination' && user && (
          <div className="h-full">
            <VaccinationTab userId={user.id} />
          </div>
        )}

        {activeTab === 'pregnancy' && user && (
          <div className="h-full">
            <PregnancyWeeksTab userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <CuteLoader />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}