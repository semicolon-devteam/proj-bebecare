'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Baby, BarChart3, Milk, ClipboardList, MessageCircle, BookOpen } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  placement?: 'top' | 'bottom';
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="baby-profile"]',
    title: '아이 프로필',
    icon: Baby,
    content: '우리 아이 프로필이에요. 임신 주수나 월령이 자동으로 계산돼요.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="today-summary"]',
    title: '오늘의 요약',
    icon: BarChart3,
    content: '오늘 기록한 수유·수면·기저귀를 한눈에 확인할 수 있어요.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="quick-log"]',
    title: '퀵 기록',
    icon: Milk,
    content: '탭 한 번으로 분유, 수면, 기저귀 등을 바로 기록하세요!',
    placement: 'top',
  },
  {
    target: '[data-tour="tab-log"]',
    title: '기록 탭',
    icon: ClipboardList,
    content: '상세 기록, 또래 비교, 음성 입력을 사용할 수 있어요.',
    placement: 'top',
  },
  {
    target: '[data-tour="tab-chat"]',
    title: 'AI 상담',
    icon: MessageCircle,
    content: '궁금한 건 AI에게 물어보세요. 아이 기록을 참고해서 맞춤 조언을 드려요.',
    placement: 'top',
  },
  {
    target: '[data-tour="tab-explore"]',
    title: '정보 탭',
    icon: BookOpen,
    content: '정부지원, 예방접종, 임신주수 정보를 한곳에서 확인하세요.',
    placement: 'top',
  },
];

const GUIDE_KEY = 'bebecare_guide_shown_v2';

export default function OnboardingGuide() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateSpotlight = useCallback(() => {
    const current = STEPS[step];
    if (!current) return;
    const el = document.querySelector(current.target);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Small delay after scroll for accurate rect
      requestAnimationFrame(() => {
        setSpotlightRect(el.getBoundingClientRect());
      });
    }
  }, [step]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shown = localStorage.getItem(GUIDE_KEY);
    if (!shown) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    updateSpotlight();
    const handleResize = () => updateSpotlight();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [show, step, updateSpotlight]);

  const close = () => {
    setShow(false);
    localStorage.setItem(GUIDE_KEY, 'true');
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show || !spotlightRect) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const pad = 8;

  // Tooltip position
  const placement = current.placement || 'bottom';
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(16, Math.min(spotlightRect.left + spotlightRect.width / 2 - 160, window.innerWidth - 336)),
    zIndex: 10002,
    width: 320,
  };

  if (placement === 'bottom') {
    tooltipStyle.top = spotlightRect.bottom + pad + 12;
  } else {
    tooltipStyle.bottom = window.innerHeight - spotlightRect.top + pad + 12;
  }

  return (
    <>
      {/* Overlay with spotlight cutout using CSS clip-path */}
      <div
        className="fixed inset-0 z-[10000] transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.55)',
          clipPath: `polygon(
            0% 0%, 0% 100%, 
            ${spotlightRect.left - pad}px 100%, 
            ${spotlightRect.left - pad}px ${spotlightRect.top - pad}px, 
            ${spotlightRect.right + pad}px ${spotlightRect.top - pad}px, 
            ${spotlightRect.right + pad}px ${spotlightRect.bottom + pad}px, 
            ${spotlightRect.left - pad}px ${spotlightRect.bottom + pad}px, 
            ${spotlightRect.left - pad}px 100%, 
            100% 100%, 100% 0%
          )`,
        }}
        onClick={close}
      />

      {/* Spotlight border glow */}
      <div
        className="fixed z-[10001] rounded-2xl pointer-events-none transition-all duration-300"
        style={{
          top: spotlightRect.top - pad,
          left: spotlightRect.left - pad,
          width: spotlightRect.width + pad * 2,
          height: spotlightRect.height + pad * 2,
          boxShadow: '0 0 0 3px rgba(194,114,138,0.6), 0 0 20px rgba(194,114,138,0.3)',
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-white rounded-2xl shadow-2xl p-5 animate-slide-up"
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-white rotate-45"
          style={{
            left: Math.min(
              Math.max(24, spotlightRect.left + spotlightRect.width / 2 - (tooltipStyle.left as number)),
              296
            ),
            ...(placement === 'bottom' ? { top: -6 } : { bottom: -6 }),
          }}
        />

        {/* Skip button */}
        <button
          onClick={close}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>

        {/* Content */}
        <h3 className="text-base font-bold text-gray-900 mb-1.5 pr-6 flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
            <current.icon className="h-3.5 w-3.5 text-dusty-rose" />
          </span>
          {current.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{current.content}</p>

        {/* Progress + Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-dusty-rose' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-0.5 px-3 py-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-0.5 px-4 py-2 bg-dusty-rose text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {isLast ? '시작하기!' : (
                <>다음 <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
