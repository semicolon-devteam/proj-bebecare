'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import BottomTabBar from './BottomTabBar';
import type { User } from '@supabase/supabase-js';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [pathname]);

  // 탭바를 숨길 페이지들
  const hideTabBarRoutes = ['/login', '/signup', '/onboarding'];
  const shouldShowTabBar = !loading && user && !hideTabBarRoutes.includes(pathname);

  return (
    <div className="mx-auto w-full max-w-2xl md:max-w-4xl">
      <div className={shouldShowTabBar ? 'pb-20' : ''}>
        {children}
      </div>
      <BottomTabBar isVisible={!!shouldShowTabBar} />
    </div>
  );
}