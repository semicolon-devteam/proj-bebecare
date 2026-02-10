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
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-dusty-rose">
            BebeCare
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            임신·출산·육아 슈퍼앱
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-600 mb-1.5">
                  이메일
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm shadow-sm focus:border-dusty-rose focus:outline-none focus:ring-1 focus:ring-dusty-rose/20 transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-600 mb-1.5">
                  비밀번호
                </label>
                <input
                  id="password" name="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm shadow-sm focus:border-dusty-rose focus:outline-none focus:ring-1 focus:ring-dusty-rose/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg bg-dusty-rose px-6 py-3 font-semibold text-white hover:bg-dusty-rose-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>

            <div className="text-center text-sm text-gray-500 pt-2">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="font-semibold text-dusty-rose hover:text-dusty-rose-dark transition-colors">
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
