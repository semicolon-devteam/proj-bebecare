import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isOnboardingCompleted } from '@/lib/profile';
import HomeDashboard from '@/components/HomeDashboard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Baby, Heart, MessageCircle, Calendar, Bell, Shield } from 'lucide-react';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const completed = await isOnboardingCompleted(supabase, user.id);
    if (!completed) {
      redirect('/onboarding');
    }
    return (
      <div className="flex min-h-screen flex-col bg-surface-warm">
        <HomeDashboard user={{ id: user.id, email: user.email ?? undefined }} />
      </div>
    );
  }

  // Landing page — server rendered for SEO
  return (
    <div className="flex min-h-screen flex-col bg-gradient-landing">
      {/* Hero Section */}
      <div className="flex min-h-screen items-center justify-center px-5 py-16">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex">
                <Badge variant="default" size="lg">
                  <Heart className="h-3.5 w-3.5" />
                  AI 기반 맞춤 정보
                </Badge>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  행복한 임신·출산·육아,
                  <br />
                  <span className="text-dusty-rose-500">BebeCare</span>와 함께
                </h1>
                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  AI가 분석한 맞춤 정보와 육아 기록으로
                  <br className="hidden sm:block" />
                  소중한 순간을 놓치지 마세요
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button variant="primary" size="xl" fullWidth className="sm:w-auto">
                    무료로 시작하기
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="xl" fullWidth className="sm:w-auto">
                    로그인
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-gradient-avatar border-2 border-white" />
                    ))}
                  </div>
                  <span className="font-medium">1,000+ 사용자</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-500">★★★★★</span>
                  <span className="font-medium">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Visual */}
            <div className="relative">
              <Card shadow="xl" padding="lg" hover="lift" className="bg-gradient-card">
                <div className="flex justify-center mb-6">
                  <svg width="240" height="240" viewBox="0 0 160 160" fill="none" aria-hidden="true">
                    <circle cx="80" cy="80" r="72" fill="#FFF0EB" />
                    <circle cx="80" cy="65" r="28" fill="#FFD6CC" />
                    <ellipse cx="80" cy="110" rx="36" ry="24" fill="#FFD6CC" />
                    <circle cx="71" cy="60" r="3" fill="#6B5B5B" />
                    <circle cx="89" cy="60" r="3" fill="#6B5B5B" />
                    <path d="M74 70 Q80 76 86 70" stroke="#E8889A" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <circle cx="64" cy="68" r="5" fill="#FFB3B3" opacity="0.4" />
                    <circle cx="96" cy="68" r="5" fill="#FFB3B3" opacity="0.4" />
                  </svg>
                </div>
                <div className="space-y-3 text-center">
                  <h3 className="text-h3 font-bold text-dusty-rose-500">BebeCare</h3>
                  <p className="text-body text-gray-600">
                    임신부터 육아까지, 모든 순간을 함께합니다
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-5 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h2 font-bold text-gray-900 mb-4">
              BebeCare가 특별한 이유
            </h2>
            <p className="text-body-lg text-gray-600">
              AI 기반 맞춤 정보와 체계적인 관리로 육아를 더 쉽게
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card shadow="md" padding="lg" hover="lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <Baby className="h-6 w-6 text-dusty-rose-500" />
                </div>
                <h3 className="text-h4 font-bold text-gray-900">맞춤 정보</h3>
              </div>
              <p className="text-body-sm text-gray-600">
                아이의 성장 단계에 맞는 정보를 AI가 자동으로 추천해드립니다.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card shadow="md" padding="lg" hover="lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-h4 font-bold text-gray-900">육아 기록</h3>
              </div>
              <p className="text-body-sm text-gray-600">
                수유, 수면, 기저귀 등 모든 육아 활동을 간편하게 기록하세요.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card shadow="md" padding="lg" hover="lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="text-h4 font-bold text-gray-900">AI 챗봇</h3>
              </div>
              <p className="text-body-sm text-gray-600">
                24시간 언제든 육아 고민을 상담하고 답변을 받아보세요.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card shadow="md" padding="lg" hover="lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-h4 font-bold text-gray-900">예방접종 관리</h3>
              </div>
              <p className="text-body-sm text-gray-600">
                접종 일정을 자동으로 알려드리고 기록을 관리해드립니다.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card shadow="md" padding="lg" hover="lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-h4 font-bold text-gray-900">맞춤 알림</h3>
              </div>
              <p className="text-body-sm text-gray-600">
                중요한 일정과 정보를 놓치지 않도록 알림을 보내드립니다.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card shadow="md" padding="lg" hover="lift">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-h4 font-bold text-gray-900">혜택 정보</h3>
              </div>
              <p className="text-body-sm text-gray-600">
                지역별 임신·출산·육아 혜택 정보를 한눈에 확인하세요.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-5 py-20 bg-gradient-profile">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-h2 font-bold text-gray-900 mb-4">
            지금 시작하세요
          </h2>
          <p className="text-body-lg text-gray-600 mb-8">
            무료로 가입하고 BebeCare의 모든 기능을 이용해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button variant="primary" size="xl">
                무료로 시작하기
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-5 py-8 bg-white border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-body-sm text-gray-500">
          <p>&copy; 2026 BebeCare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
