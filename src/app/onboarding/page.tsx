'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createOrUpdateProfile } from '@/lib/profile';
import { addChild, deriveStageFromChildren } from '@/lib/children';
import type { ChildInput } from '@/lib/children';
import { REGION_DATA } from '@/lib/regions';
import { FileText, Baby, Briefcase, MapPin, Heart, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label, Select, Card, Badge } from '@/components/ui';

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
      const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.';
      alert(`${errorMessage}\n\n다시 시도해주세요.`);
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-landing p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-body-sm font-medium text-gray-500">
            <span>프로필 설정</span>
            <span>{currentStep} / {totalSteps}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div 
              className="h-full rounded-full bg-gradient-cta transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        <Card shadow="xl" padding="lg">
          {/* Step 1: Stage */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-h2 font-bold text-gray-900">환영합니다!</h2>
                <p className="text-body text-gray-500">현재 상황을 알려주세요</p>
              </div>
              <div className="grid gap-3">
                {([
                  { value: 'planning' as const, icon: FileText, label: '임신 계획 중', color: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
                  { value: 'expecting' as const, icon: Heart, label: '임신 중', color: 'bg-pink-50 hover:bg-pink-100 border-pink-200' },
                  { value: 'born' as const, icon: Baby, label: '출산 완료 · 육아 중', color: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
                ]).map((option) => (
                  <button 
                    key={option.value} 
                    onClick={() => setHasChildren(option.value)}
                    className={`
                      w-full flex items-center gap-4 rounded-xl p-5 text-left font-semibold 
                      border-2 transition-all
                      ${hasChildren === option.value
                        ? 'bg-dusty-rose-500 text-white border-dusty-rose-500 shadow-warm-md scale-[1.02]'
                        : `${option.color} text-gray-700`
                      }
                    `}
                  >
                    <div className={`
                      h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0
                      ${hasChildren === option.value ? 'bg-white/20' : 'bg-white'}
                    `}>
                      <option.icon className={`h-6 w-6 ${hasChildren === option.value ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className="text-body-lg">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Children info */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-h2 font-bold text-gray-900">아이 정보 등록</h2>
                <p className="text-body text-gray-500">
                  {hasChildren === 'expecting' ? '출산 예정일을 입력해주세요' : '아이의 생년월일을 입력해주세요'}
                </p>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {children.map((child, index) => (
                  <Card key={index} shadow="sm" padding="md" className="border-2 border-gray-200">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Baby className="h-5 w-5 text-dusty-rose-500" />
                          <span className="text-body font-semibold text-gray-700">아이 {index + 1}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge 
                            variant={child.status === 'expecting' ? 'default' : 'info'}
                            onClick={() => toggleChildStatus(index)}
                            className="cursor-pointer"
                          >
                            {child.status === 'expecting' ? '임신 중' : '출산'}
                          </Badge>
                          {children.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeChild(index)}
                              icon={<Trash2 className="h-4 w-4" />}
                            >
                              삭제
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Nickname */}
                      <div>
                        <Label htmlFor={`nickname-${index}`}>별명 (선택)</Label>
                        <Input
                          id={`nickname-${index}`}
                          type="text"
                          placeholder="예: 첫째, 둘째"
                          value={child.nickname}
                          onChange={(e) => updateChild(index, 'nickname', e.target.value)}
                        />
                      </div>

                      {/* Dates */}
                      {child.status === 'expecting' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`lmp-${index}`}>마지막 생리 시작일</Label>
                            <Input
                              id={`lmp-${index}`}
                              type="date"
                              value={child.lastPeriodDate}
                              onChange={(e) => updateChild(index, 'lastPeriodDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`due-${index}`}>출산 예정일</Label>
                            <Input
                              id={`due-${index}`}
                              type="date"
                              value={child.dueDate}
                              onChange={(e) => updateChild(index, 'dueDate', e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Label htmlFor={`birth-${index}`} required>생년월일</Label>
                            <Input
                              id={`birth-${index}`}
                              type="date"
                              value={child.birthDate}
                              onChange={(e) => updateChild(index, 'birthDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>성별 (선택)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {[{ value: 'male', label: '남아' }, { value: 'female', label: '여아' }].map((g) => (
                                <Button
                                  key={g.value}
                                  variant={child.gender === g.value ? 'primary' : 'outline'}
                                  onClick={() => updateChild(index, 'gender', g.value)}
                                  fullWidth
                                >
                                  {g.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                fullWidth
                onClick={addChildRow}
                icon={<Plus className="h-4 w-4" />}
              >
                아이 추가
              </Button>
            </div>
          )}

          {/* Step 3: Working */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-h2 font-bold text-gray-900">직장 여부</h2>
                <p className="text-body text-gray-500">현재 직장에 다니고 계신가요?</p>
              </div>
              <div className="grid gap-3">
                {([
                  { value: true, icon: Briefcase, label: '네, 직장에 다니고 있어요', color: 'bg-green-50 hover:bg-green-100 border-green-200' },
                  { value: false, icon: MapPin, label: '아니요', color: 'bg-gray-50 hover:bg-gray-100 border-gray-200' },
                ] as const).map((option) => (
                  <button 
                    key={String(option.value)} 
                    onClick={() => setIsWorking(option.value)}
                    className={`
                      w-full flex items-center gap-4 rounded-xl p-5 text-left font-semibold 
                      border-2 transition-all
                      ${isWorking === option.value
                        ? 'bg-dusty-rose-500 text-white border-dusty-rose-500 shadow-warm-md scale-[1.02]'
                        : `${option.color} text-gray-700`
                      }
                    `}
                  >
                    <div className={`
                      h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0
                      ${isWorking === option.value ? 'bg-white/20' : 'bg-white'}
                    `}>
                      <option.icon className={`h-6 w-6 ${isWorking === option.value ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <span className="text-body-lg">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Region */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-h2 font-bold text-gray-900">지역 선택</h2>
                <p className="text-body text-gray-500">거주 지역을 선택해주세요</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="province" required>시/도</Label>
                  <Select 
                    id="province"
                    value={province} 
                    onChange={(e) => { setProvince(e.target.value); setCity(''); }}
                  >
                    <option value="">선택해주세요</option>
                    {Object.keys(REGION_DATA).map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </div>
                {province && (
                  <div>
                    <Label htmlFor="city" required>시/군/구</Label>
                    <Select 
                      id="city"
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="">선택해주세요</option>
                      {REGION_DATA[province]?.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={prevStep}
                className="flex-1"
              >
                이전
              </Button>
            )}
            {step < 4 ? (
              <Button 
                variant="primary"
                size="lg"
                onClick={nextStep} 
                disabled={!canProceed()}
                className="flex-1"
              >
                다음
              </Button>
            ) : (
              <Button 
                variant="primary"
                size="lg"
                onClick={handleSubmit} 
                disabled={!canProceed() || saving}
                loading={saving}
                className="flex-1"
              >
                {saving ? '저장 중...' : '시작하기'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
