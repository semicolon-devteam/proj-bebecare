'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/profile';
import { addChild, deriveStageFromChildren } from '@/lib/children';
import type { ChildInput } from '@/lib/children';
import { REGION_DATA } from '@/lib/regions';
import { FileText, Baby, Briefcase, MapPin, Heart } from 'lucide-react';

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

  const [hasChildren, setHasChildren] = useState<'expecting' | 'born' | 'planning' | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [isWorking, setIsWorking] = useState<boolean | null>(null);
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
    })();
  }, [router]);

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

      const derivedChildren = savedChildren.map((c) => ({
        id: '', user_id: userId, status: c.status!, nickname: c.nickname || null, name: null,
        due_date: c.due_date || null, pregnancy_start_date: c.pregnancy_start_date || null,
        birth_date: c.birth_date || null, gender: c.gender || null, created_at: '', updated_at: '',
      }));
      const stage = hasChildren === 'planning' ? 'planning' : deriveStageFromChildren(derivedChildren);

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
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-500">
            <span>프로필 설정</span>
            <span>{currentStep} / {totalSteps}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-dusty-rose transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="card rounded-2xl p-8">
          {/* Step 1: Stage */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">환영합니다!</h2>
                <p className="text-gray-500">현재 상황을 알려주세요</p>
              </div>
              <div className="space-y-3">
                {([
                  { value: 'planning' as const, icon: FileText, label: '임신 계획 중' },
                  { value: 'expecting' as const, icon: Heart, label: '임신 중' },
                  { value: 'born' as const, icon: Baby, label: '출산 완료 · 육아 중' },
                ]).map((option) => (
                  <button key={option.value} onClick={() => setHasChildren(option.value)}
                    className={`w-full flex items-center gap-3 rounded-xl p-4 text-left font-semibold transition-all ${
                      hasChildren === option.value
                        ? 'bg-dusty-rose text-white shadow-sm'
                        : 'card hover:border-gray-300'
                    }`}>
                    <option.icon className="h-5 w-5 flex-shrink-0" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Children info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">아이 정보 등록</h2>
                <p className="text-gray-500">아이 정보를 입력해주세요</p>
              </div>
              <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
                {children.map((child, index) => (
                  <div key={index} className="card rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-500">아이 {index + 1}</span>
                      <div className="flex gap-2">
                        <button onClick={() => toggleChildStatus(index)}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            child.status === 'expecting' ? 'bg-pink-50 text-dusty-rose' : 'bg-blue-50 text-blue-600'
                          }`}>
                          {child.status === 'expecting' ? '임신 중' : '출산'}
                        </button>
                        {children.length > 1 && (
                          <button onClick={() => removeChild(index)} className="text-sm text-red-400 hover:text-red-600 font-semibold">삭제</button>
                        )}
                      </div>
                    </div>

                    <input type="text" placeholder="별명 (선택)" value={child.nickname}
                      onChange={(e) => updateChild(index, 'nickname', e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20 transition-all" />

                    {child.status === 'expecting' ? (
                      <>
                        <div>
                          <span className="mb-1 block text-xs font-semibold text-gray-500">마지막 생리 시작일</span>
                          <input type="date" value={child.lastPeriodDate}
                            onChange={(e) => updateChild(index, 'lastPeriodDate', e.target.value)}
                            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20 transition-all" />
                        </div>
                        <div>
                          <span className="mb-1 block text-xs font-semibold text-gray-500">출산 예정일</span>
                          <input type="date" value={child.dueDate}
                            onChange={(e) => updateChild(index, 'dueDate', e.target.value)}
                            className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20 transition-all" />
                        </div>
                      </>
                    ) : (
                      <>
                        <input type="date" value={child.birthDate}
                          onChange={(e) => updateChild(index, 'birthDate', e.target.value)}
                          className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20 transition-all" />
                        <div className="flex gap-2">
                          {[{ value: 'male', label: '남아' }, { value: 'female', label: '여아' }].map((g) => (
                            <button key={g.value} onClick={() => updateChild(index, 'gender', g.value)}
                              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                                child.gender === g.value ? 'bg-dusty-rose text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                              }`}>{g.label}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addChildRow}
                className="w-full rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-semibold text-gray-400 hover:border-dusty-rose hover:text-dusty-rose transition-colors">
                + 아이 추가
              </button>
            </div>
          )}

          {/* Step 3: Working */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">직장 여부</h2>
                <p className="text-gray-500">현재 직장에 다니고 계신가요?</p>
              </div>
              <div className="space-y-3">
                {([
                  { value: true, icon: Briefcase, label: '네, 직장에 다니고 있어요' },
                  { value: false, icon: MapPin, label: '아니요' },
                ] as const).map((option) => (
                  <button key={String(option.value)} onClick={() => setIsWorking(option.value)}
                    className={`w-full flex items-center gap-3 rounded-xl p-4 text-left font-semibold transition-all ${
                      isWorking === option.value ? 'bg-dusty-rose text-white shadow-sm' : 'card hover:border-gray-300'
                    }`}>
                    <option.icon className="h-5 w-5 flex-shrink-0" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Region */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">지역 선택</h2>
                <p className="text-gray-500">거주 지역을 선택해주세요</p>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-gray-600">시/도</span>
                  <select value={province} onChange={(e) => { setProvince(e.target.value); setCity(''); }}
                    className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20 transition-all">
                    <option value="">선택해주세요</option>
                    {Object.keys(REGION_DATA).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                {province && (
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-gray-600">시/군/구</span>
                    <select value={city} onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20 transition-all">
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
                className="flex-1 rounded-xl border border-border py-3.5 font-semibold text-gray-500 hover:bg-gray-50 transition-colors">이전</button>
            )}
            {step < 4 ? (
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex-1 rounded-xl bg-dusty-rose py-3.5 font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dusty-rose-dark transition-colors">다음</button>
            ) : (
              <button onClick={handleSubmit} disabled={!canProceed() || saving}
                className="flex-1 rounded-xl bg-dusty-rose py-3.5 font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dusty-rose-dark transition-colors">
                {saving ? '저장 중...' : '시작하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
