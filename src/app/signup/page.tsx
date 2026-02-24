'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { CheckCircle } from 'lucide-react';
import { Button, Input, Label, Card } from '@/components/ui';

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
      const { user, error: authError } = await signUp(email, password);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (user) {
        // 이메일 인증 없이 바로 가입+로그인 완료 → 온보딩으로 이동
        router.push('/onboarding');
        return;
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-landing p-4">
        <div className="w-full max-w-md">
          <Card shadow="lg" padding="lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sage-50 mb-6">
                <CheckCircle className="h-8 w-8 text-sage-400" aria-hidden="true" />
              </div>
              <h2 className="text-h2 font-bold text-gray-900 mb-4">
                회원가입이 완료되었습니다!
              </h2>
              <div className="space-y-2 text-gray-500">
                <p className="text-body">
                  이메일을 확인하여 계정을 인증해주세요.
                </p>
                <p className="text-body-sm">
                  잠시 후 로그인 페이지로 이동합니다...
                </p>
              </div>
              <div className="mt-6">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-sage-400 animate-pulse rounded-full" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

        {/* Signup Form Card */}
        <Card shadow="lg" padding="lg">
          <h2 className="text-h3 font-bold text-gray-900 mb-6 text-center">회원가입</h2>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
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
              {loading ? '가입 중...' : '회원가입'}
            </Button>

            <div className="text-center text-body-sm text-gray-500 pt-2">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="font-semibold text-dusty-rose-500 hover:text-dusty-rose-600 transition-colors"
              >
                로그인
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
