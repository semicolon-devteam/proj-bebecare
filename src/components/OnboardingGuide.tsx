'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Mic, BarChart3, Users, MessageCircle, ClipboardList } from 'lucide-react';

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector or area hint
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: '🍼 퀵 기록',
    description: '홈 화면에서 바로 분유, 수면, 기저귀 등을 기록하세요. 탭 한 번으로 간편하게!',
    icon: <ClipboardList className="h-8 w-8 text-dusty-rose" />,
  },
  {
    title: '🎙 음성 기록',
    description: '"분유 170ml 먹었어" 처럼 말하면 AI가 자동으로 기록해요. 아기 안고도 한 손으로 기록!',
    icon: <Mic className="h-8 w-8 text-sage" />,
  },
  {
    title: '📊 또래 비교',
    description: '기록 탭의 "또래비교"에서 우리 아이가 또래 대비 잘먹고, 잘자고, 잘싸는지 확인하세요.',
    icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
  },
  {
    title: '💬 AI 상담',
    description: '궁금한 건 뭐든 물어보세요. 아이 기록 데이터를 참고해서 맞춤 조언을 드려요.',
    icon: <MessageCircle className="h-8 w-8 text-blue-500" />,
  },
  {
    title: '👨‍👩‍👧 가족 동기화',
    description: '마이페이지에서 가족을 만들고 초대 코드를 공유하면 함께 기록을 볼 수 있어요.',
    icon: <Users className="h-8 w-8 text-amber-500" />,
  },
];

const GUIDE_KEY = 'bebecare_guide_shown';

export default function OnboardingGuide() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shown = localStorage.getItem(GUIDE_KEY);
    if (!shown) {
      // Show after a small delay
      const t = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setShow(false);
    localStorage.setItem(GUIDE_KEY, 'true');
  };

  const next = () => {
    if (step < GUIDE_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  if (!show) return null;

  const current = GUIDE_STEPS[step];
  const isLast = step === GUIDE_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
        {/* Close */}
        <div className="flex justify-end p-3 pb-0">
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            {current.icon}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{current.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {GUIDE_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-dusty-rose' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-400"
            >
              이전
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 rounded-xl bg-dusty-rose py-3 text-sm font-semibold text-white flex items-center justify-center gap-1 hover:opacity-90"
          >
            {isLast ? '시작하기! 🎉' : (
              <>다음 <ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
