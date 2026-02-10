'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { CheckCircle } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await signUp(email, password);

      if (error) {
        setError(error.message);
        return;
      }

      if (user) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md">
          <div className="card rounded-2xl p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sage/10 mb-6">
              <CheckCircle className="h-8 w-8 text-sage" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              회원가입이 완료되었습니다!
            </h2>
            <div className="space-y-2 text-gray-500">
              <p className="text-base">
                이메일을 확인하여 계정을 인증해주세요.
              </p>
              <p className="text-sm">
                잠시 후 로그인 페이지로 이동합니다...
              </p>
            </div>
            <div className="mt-6">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-sage animate-pulse rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Signup Form Card */}
        <div className="card rounded-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">회원가입</h2>

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
                  id="password" name="password" type="password" autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm shadow-sm focus:border-dusty-rose focus:outline-none focus:ring-1 focus:ring-dusty-rose/20 transition-all"
                  placeholder="최소 6자 이상"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-600 mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm shadow-sm focus:border-dusty-rose focus:outline-none focus:ring-1 focus:ring-dusty-rose/20 transition-all"
                  placeholder="비밀번호 재입력"
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
                  가입 중...
                </span>
              ) : (
                '회원가입'
              )}
            </button>

            <div className="text-center text-sm text-gray-500 pt-2">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-semibold text-dusty-rose hover:text-dusty-rose-dark transition-colors">
                로그인
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
