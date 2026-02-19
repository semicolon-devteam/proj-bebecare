'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
  Menu,
  User as UserIcon,
  Bell,
  TrendingUp,
  Users,
  HelpCircle,
  MessageSquare,
  LogOut,
  ChevronRight
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MorePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠어요?')) {
      try {
        await supabase.auth.signOut();
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  const menuItems = [
    {
      icon: UserIcon,
      title: '프로필 관리',
      description: '개인정보 및 아기 정보 수정',
      action: () => router.push('/mypage'),
      available: true,
    },
    {
      icon: Bell,
      title: '알림 설정',
      description: '푸시 알림 및 정보 수신 설정',
      action: () => router.push('/notifications'),
      available: true,
    },
    {
      icon: TrendingUp,
      title: '성장 기록',
      description: '아기의 성장 곡선 및 발달 기록',
      action: () => {},
      available: false,
      badge: 'Coming Soon',
    },
    {
      icon: Users,
      title: '가족 공유',
      description: '가족 구성원과 육아 정보 공유',
      action: () => {},
      available: false,
      badge: 'Coming Soon',
    },
    {
      icon: HelpCircle,
      title: '도움말',
      description: '앱 사용법 및 자주 묻는 질문',
      action: () => {
        // 임시로 알림 표시
        alert('도움말 페이지는 준비 중입니다.');
      },
      available: true,
    },
    {
      icon: MessageSquare,
      title: '피드백',
      description: '의견 및 개선사항 제안',
      action: () => {
        // 임시로 메일 앱 열기
        window.open('mailto:support@bebecare.app?subject=BebeCare 피드백');
      },
      available: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Menu className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
            더보기
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-surface pb-24">
        <div className="px-4 py-6 space-y-6">
          {/* User Info Card */}
          {user && (
            <div className="card p-4 bg-gradient-to-r from-dusty-rose/5 to-sage/5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-dusty-rose/20 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-dusty-rose" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {user.user_metadata?.name || user.email?.split('@')[0] || '사용자'}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.available ? item.action : undefined}
                  disabled={!item.available}
                  className={`w-full p-4 rounded-xl border transition-colors text-left flex items-center justify-between ${
                    item.available
                      ? 'bg-white border-gray-100 hover:bg-gray-50'
                      : 'bg-gray-50 border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      item.available ? 'bg-gray-100' : 'bg-gray-200'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        item.available ? 'text-gray-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${
                        item.available ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm ${
                        item.available ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.available && (
                      <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full p-4 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors text-left flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-red-600">로그아웃</h3>
                <p className="text-sm text-red-400">계정에서 로그아웃합니다</p>
              </div>
            </button>
          </div>

          {/* App Info */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">BebeCare v1.0.0</p>
            <p className="text-xs text-gray-300 mt-1">© 2026 Semicolon Team</p>
          </div>
        </div>
      </div>
    </div>
  );
}