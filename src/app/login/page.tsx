'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth';
import { Button, Input, Label, Card } from '@/components/ui';

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
      const { user, error: authError } = await signIn(email, password);

      if (authError) {
        setError(authError.message);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-landing p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-h1 font-bold text-dusty-rose-500">
            BebeCare
          </h1>
          <p className="mt-2 text-body-sm text-gray-500">
            임신·출산·육아 슈퍼앱
          </p>
        </div>

        {/* Login Form Card */}
        <Card shadow="lg" padding="lg">
          <h2 className="text-h3 font-bold text-gray-900 mb-6 text-center">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>

            <div className="text-center text-body-sm text-gray-500 pt-2">
              계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="font-semibold text-dusty-rose-500 hover:text-dusty-rose-600 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
