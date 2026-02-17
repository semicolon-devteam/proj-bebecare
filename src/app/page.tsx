import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isOnboardingCompleted } from '@/lib/profile';
import HomeDashboard from '@/components/HomeDashboard';

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const completed = await isOnboardingCompleted(user.id);
    if (!completed) {
      redirect('/onboarding');
    }
    return (
      <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#FFF9F5' }}>
        <HomeDashboard user={{ id: user.id, email: user.email ?? undefined }} />
      </div>
    );
  }

  // Landing page — server rendered for SEO
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#FFF9F5' }}>
      <div
        className="flex min-h-screen items-center justify-center px-5 py-8"
        style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #FEF0E8 100%)' }}
      >
        <div className="w-full max-w-lg space-y-8">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div
              className="card rounded-3xl px-6 py-10"
              style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F0 100%)' }}
            >
              {/* Inline SVG illustration for SSR */}
              <div className="flex justify-center mb-6">
                <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
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
              <h1 className="text-4xl md:text-5xl font-bold text-dusty-rose" style={{ letterSpacing: '0.05em' }}>
                BebeCare
              </h1>
              <p className="mt-3 text-lg font-semibold text-gray-700">
                임신·출산·육아 슈퍼앱
              </p>
              <p className="mt-1 text-sm text-gray-400">
                AI 기반 맞춤 정보 제공 서비스
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <div className="card rounded-3xl p-6 text-center relative overflow-hidden">
              <p className="text-lg font-semibold text-gray-700 leading-relaxed">
                BebeCare와 함께
                <br />
                <span className="text-xl font-bold text-dusty-rose">
                  행복한 임신·출산·육아
                </span>
                <br />
                를 시작하세요
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/login"
                className="rounded-2xl px-6 py-4 font-semibold text-white shadow-md hover:shadow-lg transition-all text-center"
                style={{ background: 'linear-gradient(135deg, #C2728A 0%, #D4A0B0 100%)' }}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="card rounded-2xl px-6 py-4 font-semibold text-dusty-rose card-hover text-center"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
