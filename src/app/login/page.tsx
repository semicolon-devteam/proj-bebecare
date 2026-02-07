'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        return;
      }

      if (user) {
        // 로그인 성공 시 홈으로 리다이렉트
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header Card */}
        <div className="text-center animate-slide-down">
          <div className="inline-block rounded-2xl bg-white/80 backdrop-blur-sm px-8 py-6 shadow-2xl border border-white/20">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              BebeCare
            </h1>
            <p className="mt-2 text-base font-medium text-gray-600">
              임신·출산·육아 슈퍼앱
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 text-sm text-red-700 font-medium animate-slide-down">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-bold text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="text-center text-sm text-gray-600 pt-2">
              계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
