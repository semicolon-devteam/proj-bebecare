'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createOrUpdateProfile, addChild } from '@/lib/profile';
import type { ChildData } from '@/lib/profile';

const REGION_DATA: Record<string, string[]> = {
  서울: ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
  경기: ['수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','시흥시','파주시','광명시','김포시','군포시','광주시','이천시','양주시','오산시','구리시','안성시','포천시','의왕시','하남시','여주시','동두천시','과천시'],
  부산: ['해운대구','부산진구','동래구','남구','북구','사하구','금정구','연제구','수영구','사상구','기장군','중구','서구','동구','영도구','강서구'],
  대구: ['수성구','달서구','북구','중구','동구','서구','남구','달성군'],
  인천: ['남동구','부평구','서구','연수구','미추홀구','계양구','중구','동구','강화군','옹진군'],
  광주: ['북구','서구','광산구','남구','동구'],
  대전: ['유성구','서구','중구','동구','대덕구'],
  울산: ['남구','중구','북구','동구','울주군'],
  세종: ['세종시'],
};

type Stage = 'planning' | 'pregnant' | 'postpartum';

interface ChildInput {
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
}

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [stage, setStage] = useState<Stage | null>(null);

  // Step 2 - pregnant
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Step 2 - postpartum
  const [children, setChildren] = useState<ChildInput[]>([
    { name: '', birth_date: '', gender: 'male' },
  ]);

  // Step 3
  const [isWorking, setIsWorking] = useState<boolean | null>(null);

  // Step 4
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
    })();
  }, [router]);

  const totalSteps = stage === 'planning' ? 3 : 4;
  const currentStep = (() => {
    if (stage === 'planning') {
      // steps: 1(stage), 2(work), 3(region) — skip step2
      if (step <= 1) return 1;
      if (step === 2) return 2; // actually step 3 (work)
      return 3; // step 4 (region)
    }
    return step;
  })();

  const calcDueFromLMP = (lmp: string) => {
    const d = new Date(lmp);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split('T')[0];
  };

  const calcLMPFromDue = (due: string) => {
    const d = new Date(due);
    d.setDate(d.getDate() - 280);
    return d.toISOString().split('T')[0];
  };

  const handleLastPeriodChange = (val: string) => {
    setLastPeriodDate(val);
    if (val) setDueDate(calcDueFromLMP(val));
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    if (val) setLastPeriodDate(calcLMPFromDue(val));
  };

  const addChildRow = () => {
    setChildren([...children, { name: '', birth_date: '', gender: 'male' }]);
  };

  const updateChild = (index: number, field: keyof ChildInput, value: string) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return stage !== null;
      case 2:
        if (stage === 'pregnant') return lastPeriodDate || dueDate;
        if (stage === 'postpartum')
          return children.every((c) => c.name && c.birth_date);
        return true;
      case 3:
        return isWorking !== null;
      case 4:
        return province && city;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step === 1 && stage === 'planning') {
      setStep(3); // skip step 2
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 3 && stage === 'planning') {
      setStep(1); // skip back over step 2
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      await createOrUpdateProfile(userId, {
        stage: stage || 'planning',
        is_pregnant: stage === 'pregnant',
        due_date: dueDate || null,
        pregnancy_start_date: lastPeriodDate || null,
        is_working: isWorking === true,
        region_province: province,
        region_city: city,
        onboarding_completed: true,
      });

      if (stage === 'postpartum') {
        for (const child of children) {
          if (child.name && child.birth_date) {
            await addChild(userId, child as ChildData);
          }
        }
      }

      router.push('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200 p-4">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 h-72 w-72 animate-float rounded-full bg-gradient-to-br from-pink-400 to-rose-400 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 -right-4 h-72 w-72 animate-float rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 blur-3xl animation-delay-1000" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-600">
            <span>프로필 설정</span>
            <span>{currentStep} / {totalSteps}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          {/* Step 1: Stage */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-4xl">👋</span>
                <h2 className="text-2xl font-black text-gray-800">환영합니다!</h2>
                <p className="text-gray-600">현재 상황을 알려주세요</p>
              </div>
              <div className="space-y-3">
                {([
                  { value: 'planning' as Stage, emoji: '📋', label: '임신 계획 중' },
                  { value: 'pregnant' as Stage, emoji: '🤰', label: '임신 중' },
                  { value: 'postpartum' as Stage, emoji: '👶', label: '출산 완료 · 육아 중' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStage(option.value)}
                    className={`w-full rounded-2xl p-5 text-left font-bold transition-all duration-300 ${
                      stage === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02]'
                        : 'glass hover:scale-[1.01]'
                    }`}
                  >
                    <span className="mr-3 text-2xl">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Pregnancy details or children */}
          {step === 2 && stage === 'pregnant' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-4xl">🤰</span>
                <h2 className="text-2xl font-black text-gray-800">임신 정보</h2>
                <p className="text-gray-600">둘 중 하나만 입력하면 자동 계산돼요</p>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-gray-700">마지막 생리 시작일</span>
                  <input
                    type="date"
                    value={lastPeriodDate}
                    onChange={(e) => handleLastPeriodChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-gray-700">출산 예정일</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && stage === 'postpartum' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-4xl">👶</span>
                <h2 className="text-2xl font-black text-gray-800">아이 정보</h2>
                <p className="text-gray-600">아이 정보를 입력해주세요</p>
              </div>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                {children.map((child, index) => (
                  <div key={index} className="glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">아이 {index + 1}</span>
                      {children.length > 1 && (
                        <button
                          onClick={() => removeChild(index)}
                          className="text-sm text-red-400 hover:text-red-600 font-bold"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="이름"
                      value={child.name}
                      onChange={(e) => updateChild(index, 'name', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <input
                      type="date"
                      value={child.birth_date}
                      onChange={(e) => updateChild(index, 'birth_date', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                    />
                    <div className="flex gap-2">
                      {([
                        { value: 'male', label: '👦 남아' },
                        { value: 'female', label: '👧 여아' },
                      ] as const).map((g) => (
                        <button
                          key={g.value}
                          onClick={() => updateChild(index, 'gender', g.value)}
                          className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
                            child.gender === g.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-white/50 text-gray-600 hover:bg-white/80'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addChildRow}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-bold text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all"
              >
                + 아이 추가
              </button>
            </div>
          )}

          {/* Step 3: Working */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-4xl">💼</span>
                <h2 className="text-2xl font-black text-gray-800">직장 여부</h2>
                <p className="text-gray-600">현재 직장에 다니고 계신가요?</p>
              </div>
              <div className="space-y-3">
                {([
                  { value: true, emoji: '🏢', label: '네, 직장에 다니고 있어요' },
                  { value: false, emoji: '🏠', label: '아니요' },
                ] as const).map((option) => (
                  <button
                    key={String(option.value)}
                    onClick={() => setIsWorking(option.value)}
                    className={`w-full rounded-2xl p-5 text-left font-bold transition-all duration-300 ${
                      isWorking === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02]'
                        : 'glass hover:scale-[1.01]'
                    }`}
                  >
                    <span className="mr-3 text-2xl">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Region */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-4xl">📍</span>
                <h2 className="text-2xl font-black text-gray-800">지역 선택</h2>
                <p className="text-gray-600">거주 지역을 선택해주세요</p>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-gray-700">시/도</span>
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setCity('');
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                  >
                    <option value="">선택해주세요</option>
                    {Object.keys(REGION_DATA).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                {province && (
                  <label className="block animate-fade-in">
                    <span className="mb-1 block text-sm font-bold text-gray-700">시/군/구</span>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      <option value="">선택해주세요</option>
                      {REGION_DATA[province]?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 rounded-2xl border-2 border-gray-200 py-4 font-bold text-gray-600 hover:bg-white/50 transition-all"
              >
                이전
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-bold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || saving}
                className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 font-bold text-white shadow-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
              >
                {saving ? '저장 중...' : '시작하기 🎉'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
