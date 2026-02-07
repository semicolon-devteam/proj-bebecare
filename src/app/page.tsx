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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-lg font-medium text-gray-700 animate-pulse">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="text-center space-y-4 animate-slide-down">
          <div className="inline-block rounded-2xl bg-white/80 backdrop-blur-sm px-8 py-6 shadow-2xl border border-white/20">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              BebeCare
            </h1>
            <p className="mt-3 text-xl md:text-2xl font-semibold text-gray-700">임신·출산·육아 슈퍼앱</p>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              AI 기반 맞춤 정보 제공 서비스 ✨
            </p>
          </div>
        </div>

        {user ? (
          <div className="space-y-6 animate-fade-in">
            {/* Welcome Card */}
            <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-8 text-center shadow-xl transform hover:scale-105 transition-transform duration-300">
              <p className="text-2xl font-bold text-white drop-shadow-lg">
                환영합니다! 🎉
              </p>
              <p className="mt-3 text-lg text-white/90 font-medium">{user.email}</p>
            </div>

            {/* Feature Cards */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="group rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-blue-200 cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      맞춤 정보
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      임신 주차, 아이 개월 수에 맞는 정보를 받아보세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-purple-200 cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-600 p-3 shadow-lg">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                      AI 상담
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      AI 기반 개인화된 육아 조언을 받아보세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-pink-200 cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-gradient-to-br from-pink-500 to-rose-600 p-3 shadow-lg">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                      타임라인
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      중요한 일정과 체크리스트를 관리하세요
                    </p>
                  </div>
                </div>
              </div>

              <div className="group rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-green-200 cursor-pointer transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-3 shadow-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                      정부지원
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      지역별 정부 지원금 정보를 확인하세요
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl bg-white/80 backdrop-blur-sm px-6 py-4 font-semibold text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Message */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-8 text-center shadow-xl border border-white/20">
              <p className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed">
                BebeCare와 함께 <br className="md:hidden" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  행복한 임신·출산·육아
                </span>를 <br className="md:hidden" />
                시작하세요 💝
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => router.push('/login')}
                className="group relative rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10">로그인</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="rounded-xl bg-white/80 backdrop-blur-sm px-8 py-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-blue-200 hover:border-purple-300 transform hover:-translate-y-1"
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
