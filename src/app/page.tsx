'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

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

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-2xl text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-8">
      <div className="w-full max-w-4xl space-y-8 rounded-2xl bg-white p-12 shadow-xl">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary">BebeCare</h1>
          <p className="mt-4 text-xl text-gray-600">임신·출산·육아 슈퍼앱</p>
          <p className="mt-2 text-sm text-gray-500">
            AI 기반 맞춤 정보 제공 서비스
          </p>
        </div>

        {user ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <p className="text-lg font-semibold text-green-900">
                환영합니다! 🎉
              </p>
              <p className="mt-2 text-green-700">{user.email}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border-2 border-primary/20 p-6 hover:border-primary transition-colors">
                <h3 className="text-lg font-semibold text-primary">
                  맞춤 정보
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  임신 주차, 아이 개월 수에 맞는 정보를 받아보세요
                </p>
              </div>

              <div className="rounded-lg border-2 border-primary/20 p-6 hover:border-primary transition-colors">
                <h3 className="text-lg font-semibold text-primary">
                  AI 상담
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  AI 기반 개인화된 육아 조언을 받아보세요
                </p>
              </div>

              <div className="rounded-lg border-2 border-primary/20 p-6 hover:border-primary transition-colors">
                <h3 className="text-lg font-semibold text-primary">
                  타임라인
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  중요한 일정과 체크리스트를 관리하세요
                </p>
              </div>

              <div className="rounded-lg border-2 border-primary/20 p-6 hover:border-primary transition-colors">
                <h3 className="text-lg font-semibold text-primary">
                  정부지원
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  지역별 정부 지원금 정보를 확인하세요
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              BebeCare와 함께 행복한 임신·출산·육아를 시작하세요
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => router.push('/login')}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary/90"
              >
                로그인
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary transition-all hover:bg-primary/5"
              >
                회원가입
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
