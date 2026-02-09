'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/profile';
import { addChild, deriveStageFromChildren } from '@/lib/children';
import type { ChildInput } from '@/lib/children';
import { REGION_DATA } from '@/lib/regions';

interface ChildRow {
  status: 'expecting' | 'born';
  nickname: string;
  lastPeriodDate: string;
  dueDate: string;
  birthDate: string;
  gender: string;
}

function emptyChild(status: 'expecting' | 'born'): ChildRow {
  return { status, nickname: '', lastPeriodDate: '', dueDate: '', birthDate: '', gender: '' };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: has children?
  const [hasChildren, setHasChildren] = useState<'expecting' | 'born' | 'planning' | null>(null);

  // Step 2: children info
  const [children, setChildren] = useState<ChildRow[]>([]);

  // Step 3: working
  const [isWorking, setIsWorking] = useState<boolean | null>(null);

  // Step 4: region
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
    })();
  }, [router]);

  // When hasChildren changes, init children array
  useEffect(() => {
    if (hasChildren === 'expecting') {
      setChildren([emptyChild('expecting')]);
    } else if (hasChildren === 'born') {
      setChildren([emptyChild('born')]);
    } else {
      setChildren([]);
    }
  }, [hasChildren]);

  const totalSteps = hasChildren === 'planning' ? 3 : 4;
  const currentStep = hasChildren === 'planning' ? (step <= 1 ? 1 : step === 2 ? 2 : 3) : step;

  const calcDueFromLMP = (lmp: string) => {
    const d = new Date(lmp);
    d.setDate(d.getDate() + 280);
    return d.toISOString().split('T')[0];
  };

  const updateChild = (index: number, field: keyof ChildRow, value: string) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-calc due date from LMP
    if (field === 'lastPeriodDate' && value) {
      updated[index].dueDate = calcDueFromLMP(value);
    }
    setChildren(updated);
  };

  const addChildRow = () => {
    setChildren([...children, emptyChild(hasChildren === 'expecting' ? 'expecting' : 'born')]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) setChildren(children.filter((_, i) => i !== index));
  };

  const toggleChildStatus = (index: number) => {
    const updated = [...children];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'expecting' ? 'born' : 'expecting',
    };
    setChildren(updated);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return hasChildren !== null;
      case 2:
        return children.every((c) => {
          if (c.status === 'expecting') return c.lastPeriodDate || c.dueDate;
          return c.birthDate;
        });
      case 3: return isWorking !== null;
      case 4: return province && city;
      default: return false;
    }
  };

  const nextStep = () => {
    if (step === 1 && hasChildren === 'planning') setStep(3);
    else setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 3 && hasChildren === 'planning') setStep(1);
    else setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      // Save children
      const savedChildren: ChildInput[] = [];
      for (const child of children) {
        const input: ChildInput = {
          status: child.status,
          nickname: child.nickname || null,
          due_date: child.status === 'expecting' ? (child.dueDate || null) : null,
          pregnancy_start_date: child.status === 'expecting' ? (child.lastPeriodDate || null) : null,
          birth_date: child.status === 'born' ? (child.birthDate || null) : null,
          gender: child.gender || null,
        };
        await addChild(userId, input);
        savedChildren.push(input);
      }

      // Derive stage from children
      const derivedChildren = savedChildren.map((c, i) => ({
        id: '', user_id: userId, status: c.status!, nickname: c.nickname || null, name: null,
        due_date: c.due_date || null, pregnancy_start_date: c.pregnancy_start_date || null,
        birth_date: c.birth_date || null, gender: c.gender || null, created_at: '', updated_at: '',
      }));
      const stage = hasChildren === 'planning' ? 'planning' : deriveStageFromChildren(derivedChildren);

      // Find the most imminent child for profile sync
      const expectingChild = children.find(c => c.status === 'expecting');
      const bornChild = children.find(c => c.status === 'born');

      await createOrUpdateProfile(userId, {
        stage,
        is_pregnant: stage === 'pregnant',
        due_date: expectingChild?.dueDate || null,
        pregnancy_start_date: expectingChild?.lastPeriodDate || null,
        birth_date: bornChild?.birthDate || null,
        is_working: isWorking === true,
        region_province: province,
        region_city: city,
        onboarding_completed: true,
      });

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
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

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
                  { value: 'planning' as const, emoji: '📋', label: '임신 계획 중' },
                  { value: 'expecting' as const, emoji: '🤰', label: '임신 중' },
                  { value: 'born' as const, emoji: '👶', label: '출산 완료 · 육아 중' },
                ]).map((option) => (
                  <button key={option.value} onClick={() => setHasChildren(option.value)}
                    className={`w-full rounded-2xl p-5 text-left font-bold transition-all duration-300 ${
                      hasChildren === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02]'
                        : 'glass hover:scale-[1.01]'
                    }`}>
                    <span className="mr-3 text-2xl">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Children info */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <span className="text-4xl">{hasChildren === 'expecting' ? '🤰' : '👶'}</span>
                <h2 className="text-2xl font-black text-gray-800">아이 정보 등록</h2>
                <p className="text-gray-600">아이 정보를 입력해주세요</p>
              </div>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                {children.map((child, index) => (
                  <div key={index} className="glass rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-600">아이 {index + 1}</span>
                      <div className="flex gap-2">
                        <button onClick={() => toggleChildStatus(index)}
                          className={`text-xs px-2 py-1 rounded-full font-bold ${
                            child.status === 'expecting' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                          {child.status === 'expecting' ? '🤰 임신 중' : '👶 출산'}
                        </button>
                        {children.length > 1 && (
                          <button onClick={() => removeChild(index)} className="text-sm text-red-400 hover:text-red-600 font-bold">삭제</button>
                        )}
                      </div>
                    </div>

                    <input type="text" placeholder="별명 (선택)" value={child.nickname}
                      onChange={(e) => updateChild(index, 'nickname', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all" />

                    {child.status === 'expecting' ? (
                      <>
                        <div>
                          <span className="mb-1 block text-xs font-bold text-gray-600">마지막 생리 시작일</span>
                          <input type="date" value={child.lastPeriodDate}
                            onChange={(e) => updateChild(index, 'lastPeriodDate', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all" />
                        </div>
                        <div>
                          <span className="mb-1 block text-xs font-bold text-gray-600">출산 예정일</span>
                          <input type="date" value={child.dueDate}
                            onChange={(e) => updateChild(index, 'dueDate', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all" />
                        </div>
                      </>
                    ) : (
                      <>
                        <input type="date" value={child.birthDate}
                          onChange={(e) => updateChild(index, 'birthDate', e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all" />
                        <div className="flex gap-2">
                          {[{ value: 'male', label: '👦 남아' }, { value: 'female', label: '👧 여아' }].map((g) => (
                            <button key={g.value} onClick={() => updateChild(index, 'gender', g.value)}
                              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
                                child.gender === g.value ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/50 text-gray-600 hover:bg-white/80'
                              }`}>{g.label}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addChildRow}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-bold text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all">
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
                  <button key={String(option.value)} onClick={() => setIsWorking(option.value)}
                    className={`w-full rounded-2xl p-5 text-left font-bold transition-all duration-300 ${
                      isWorking === option.value ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-[1.02]' : 'glass hover:scale-[1.01]'
                    }`}>
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
                  <select value={province} onChange={(e) => { setProvince(e.target.value); setCity(''); }}
                    className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all">
                    <option value="">선택해주세요</option>
                    {Object.keys(REGION_DATA).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                {province && (
                  <label className="block animate-fade-in">
                    <span className="mb-1 block text-sm font-bold text-gray-700">시/군/구</span>
                    <select value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all">
                      <option value="">선택해주세요</option>
                      {REGION_DATA[province]?.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button onClick={prevStep}
                className="flex-1 rounded-2xl border-2 border-gray-200 py-4 font-bold text-gray-600 hover:bg-white/50 transition-all">이전</button>
            )}
            {step < 4 ? (
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-bold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300">다음</button>
            ) : (
              <button onClick={handleSubmit} disabled={!canProceed() || saving}
                className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 font-bold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300">
                {saving ? '저장 중...' : '시작하기 🎉'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
