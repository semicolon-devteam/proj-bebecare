'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getProfile, createOrUpdateProfile } from '@/lib/profile';
import { getChildren, addChild, updateChild, deleteChild, deriveStageFromChildren } from '@/lib/children';
import type { Child, ChildInput } from '@/lib/children';
import { REGION_DATA } from '@/lib/regions';
import { ChevronLeft, Baby, Briefcase, MapPin, Settings, LogOut, Plus, Pencil, Trash2, Heart, FileText, Save, Check, Bell, BellOff, Users, Download } from 'lucide-react';
import FamilyManager from '@/components/FamilyManager';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export default function MyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  const [children, setChildren] = useState<Child[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const [childStatus, setChildStatus] = useState<'expecting' | 'born'>('expecting');
  const [childNickname, setChildNickname] = useState('');
  const [childDueDate, setChildDueDate] = useState('');
  const [childPregnancyStart, setChildPregnancyStart] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childGender, setChildGender] = useState('');

  const [isWorking, setIsWorking] = useState(false);
  const [regionProvince, setRegionProvince] = useState('');
  const [regionCity, setRegionCity] = useState('');

  const stage = deriveStageFromChildren(children);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) { router.push('/login'); return; }
        setUserId(user.id);

        const [profile, childrenData] = await Promise.all([
          getProfile(user.id),
          getChildren(user.id),
        ]);

        if (profile) {
          setIsWorking(profile.is_working || false);
          setRegionProvince(profile.region_province || '');
          setRegionCity(profile.region_city || '');
        }
        setChildren(childrenData);
      } catch (e) {
        console.error(e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Check push notification status
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushEnabled(false);
      return;
    }
    setPushEnabled(Notification.permission === 'granted');
  }, []);

  const handleTogglePush = async () => {
    if (!userId) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        // Unsubscribe
        const reg = await navigator.serviceWorker?.ready;
        const sub = await reg?.pushManager?.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          // Remove from DB
          const { supabase } = await import('@/lib/supabase');
          await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', sub.endpoint);
        }
        setPushEnabled(false);
      } else {
        // Request permission & subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          setPushLoading(false);
          return;
        }
        const reg = await navigator.serviceWorker?.ready;
        if (!reg) {
          alert('서비스 워커를 사용할 수 없습니다.');
          setPushLoading(false);
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
        // Save to server
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), userId }),
        });
        if (res.ok) {
          setPushEnabled(true);
        } else {
          alert('푸시 알림 등록에 실패했습니다.');
        }
      }
    } catch (e) {
      console.error('Push toggle error:', e);
      alert('오류가 발생했습니다.');
    }
    setPushLoading(false);
  };

  const resetChildForm = () => {
    setChildStatus('expecting');
    setChildNickname('');
    setChildDueDate('');
    setChildPregnancyStart('');
    setChildBirthDate('');
    setChildGender('');
    setEditingChild(null);
  };

  const openEditChild = (child: Child) => {
    setEditingChild(child);
    setChildStatus(child.status);
    setChildNickname(child.nickname || child.name || '');
    setChildDueDate(child.due_date || '');
    setChildPregnancyStart(child.pregnancy_start_date || '');
    setChildBirthDate(child.birth_date || '');
    setChildGender(child.gender || '');
    setShowAddChild(true);
  };

  const handleLastPeriodChange = (val: string) => {
    setChildPregnancyStart(val);
    if (val) {
      const d = new Date(val);
      d.setDate(d.getDate() + 280);
      setChildDueDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSaveChild = async () => {
    if (!userId) return;
    setSaving(true);

    const input: ChildInput = {
      status: childStatus,
      nickname: childNickname || null,
      due_date: childStatus === 'expecting' ? (childDueDate || null) : null,
      pregnancy_start_date: childStatus === 'expecting' ? (childPregnancyStart || null) : null,
      birth_date: childStatus === 'born' ? (childBirthDate || null) : null,
      gender: childGender || null,
    };

    let result: Child | null = null;
    if (editingChild) {
      result = await updateChild(editingChild.id, input);
    } else {
      result = await addChild(userId, input);
    }

    if (result) {
      const updated = await getChildren(userId);
      setChildren(updated);
      const newStage = deriveStageFromChildren(updated);
      await createOrUpdateProfile(userId, { stage: newStage });
    }

    resetChildForm();
    setShowAddChild(false);
    setSaving(false);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!userId || !confirm('정말 삭제하시겠습니까?')) return;
    await deleteChild(childId);
    const updated = await getChildren(userId);
    setChildren(updated);
    const newStage = deriveStageFromChildren(updated);
    await createOrUpdateProfile(userId, { stage: newStage });
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    try {
      await createOrUpdateProfile(userId, {
        stage,
        is_working: isWorking,
        region_province: regionProvince,
        region_city: regionCity,
      });

      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/timeline/my?reset=true', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      } catch { /* non-critical */ }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getChildWeek = (child: Child) => {
    if (child.status === 'expecting' && child.pregnancy_start_date) {
      return Math.floor((Date.now() - new Date(child.pregnancy_start_date).getTime()) / (7 * 24 * 60 * 60 * 1000));
    }
    return null;
  };

  const getChildAge = (child: Child) => {
    if (child.status === 'born' && child.birth_date) {
      const birth = new Date(child.birth_date);
      const months = (new Date().getFullYear() - birth.getFullYear()) * 12 + (new Date().getMonth() - birth.getMonth());
      if (months < 1) {
        const days = Math.floor((Date.now() - birth.getTime()) / (24 * 60 * 60 * 1000));
        return `생후 ${days}일`;
      }
      return `생후 ${months}개월`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={() => router.push('/')} aria-label="뒤로가기" className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">마이페이지</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        {/* Children list */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <h3 className="font-bold text-gray-900 text-sm">내 아이</h3>
            </div>
            <Button
              onClick={() => { resetChildForm(); setShowAddChild(true); }}
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              아이 추가
            </Button>
          </div>

          {children.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">아직 등록된 아이가 없어요</p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => {
                const week = getChildWeek(child);
                const age = getChildAge(child);
                return (
                  <Card key={child.id} padding="sm" className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          {child.status === 'expecting' ? <Heart className="h-4 w-4 text-dusty-rose" aria-hidden="true" /> : <Baby className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{child.nickname || child.name || '이름 없음'}</p>
                          <p className="text-xs text-gray-500">
                            {child.status === 'expecting'
                              ? week !== null ? `임신 ${week}주차` : '임신 중'
                              : age || '출산'}
                            {child.status === 'expecting' && child.due_date && (
                              <span className="ml-1.5 text-dusty-rose">예정일: {child.due_date}</span>
                            )}
                            {child.status === 'born' && child.birth_date && (
                              <span className="ml-1.5 text-blue-500">출산일: {child.birth_date}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditChild(child)} aria-label="아이 정보 수정">
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteChild(child.id)} aria-label="아이 삭제">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Add/Edit child form */}
        {showAddChild && (
          <Card className="space-y-4 border-2 border-dusty-rose/30">
            <h3 className="font-bold text-gray-900 text-sm">{editingChild ? '아이 정보 수정' : '아이 추가'}</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setChildStatus('expecting')}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  childStatus === 'expecting' ? 'bg-dusty-rose text-white' : 'bg-gray-50 text-gray-500 border border-border'
                }`}
              >
                임신 중
              </button>
              <button
                onClick={() => setChildStatus('born')}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  childStatus === 'born' ? 'bg-dusty-rose text-white' : 'bg-gray-50 text-gray-500 border border-border'
                }`}
              >
                출산 후
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">별명/이름 (선택)</label>
              <Input 
                type="text" 
                value={childNickname} 
                onChange={(e) => setChildNickname(e.target.value)}
                placeholder="예: 첫째, 콩이"
              />
            </div>

            {childStatus === 'expecting' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">마지막 생리 시작일</label>
                  <Input 
                    type="date" 
                    value={childPregnancyStart} 
                    onChange={(e) => handleLastPeriodChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">출산 예정일</label>
                  <Input 
                    type="date" 
                    value={childDueDate} 
                    onChange={(e) => setChildDueDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {childStatus === 'born' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">출산일</label>
                  <Input 
                    type="date" 
                    value={childBirthDate} 
                    onChange={(e) => setChildBirthDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {[{ value: 'male', label: '남아' }, { value: 'female', label: '여아' }].map((g) => (
                    <button key={g.value} onClick={() => setChildGender(g.value)}
                      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                        childGender === g.value ? 'bg-dusty-rose text-white' : 'bg-gray-50 text-gray-500'
                      }`}>{g.label}</button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setShowAddChild(false); resetChildForm(); }}
                className="flex-1"
              >
                취소
              </Button>
              <Button 
                onClick={handleSaveChild} 
                disabled={saving}
                loading={saving}
                className="flex-1"
              >
                {editingChild ? '수정하기' : '추가하기'}
              </Button>
            </div>
          </Card>
        )}

        {/* Current status */}
        <Card className="text-center space-y-2">
          <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${
            stage === 'pregnant' ? 'bg-pink-50' : stage === 'postpartum' ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            {stage === 'pregnant' ? <Heart className="h-6 w-6 text-dusty-rose" aria-hidden="true" /> :
             stage === 'postpartum' ? <Baby className="h-6 w-6 text-blue-500" aria-hidden="true" /> :
             <FileText className="h-6 w-6 text-gray-400" aria-hidden="true" />}
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {stage === 'pregnant' ? '임신 중' : stage === 'postpartum' ? '출산 후' : '임신 준비 중'}
          </h2>
          <p className="text-xs text-gray-400">아이 정보 기반으로 자동 설정됩니다</p>
        </Card>

        {/* Working status */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <h3 className="font-bold text-gray-900 text-sm">직장 여부</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsWorking(true)}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                isWorking ? 'bg-dusty-rose text-white' : 'bg-gray-50 text-gray-500 border border-border'
              }`}>직장맘</button>
            <button onClick={() => setIsWorking(false)}
              className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                !isWorking ? 'bg-dusty-rose text-white' : 'bg-gray-50 text-gray-500 border border-border'
              }`}>전업맘</button>
          </div>
        </Card>

        {/* Region */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <h3 className="font-bold text-gray-900 text-sm">지역</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">시/도</label>
              <select value={regionProvince} onChange={(e) => { setRegionProvince(e.target.value); setRegionCity(''); }}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-dusty-rose/20 focus:border-dusty-rose">
                <option value="">선택</option>
                {Object.keys(REGION_DATA).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">시/군/구</label>
              <select value={regionCity} onChange={(e) => setRegionCity(e.target.value)} disabled={!regionProvince}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-dusty-rose/20 focus:border-dusty-rose disabled:opacity-50">
                <option value="">선택</option>
                {(REGION_DATA[regionProvince] || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Save button */}
        <Button 
          onClick={handleSaveProfile} 
          disabled={saving}
          loading={saving}
          className="w-full"
          icon={saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        >
          {saved ? '저장 완료!' : '저장하기'}
        </Button>

        {/* Push Notification */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <h3 className="font-bold text-gray-900 text-sm">푸시 알림</h3>
          </div>
          <p className="text-xs text-gray-500">맞춤정보 D-Day 알림을 푸시로 받을 수 있어요.</p>
          <button
            onClick={handleTogglePush}
            disabled={pushLoading || pushEnabled === null}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              pushEnabled
                ? 'bg-gray-100 text-gray-600 border border-border hover:bg-gray-200'
                : 'bg-dusty-rose text-white hover:bg-dusty-rose-dark'
            } disabled:opacity-50`}
          >
            {pushLoading ? '처리 중...' : pushEnabled ? (
              <><BellOff className="h-4 w-4" aria-hidden="true" /> 알림 끄기</>
            ) : (
              <><Bell className="h-4 w-4" aria-hidden="true" /> 알림 켜기</>
            )}
          </button>
          {pushEnabled === false && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
            <p className="text-xs text-red-500">⚠️ 브라우저에서 알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.</p>
          )}
        </Card>

        {/* Family */}
        {userId && <FamilyManager userId={userId} />}

        {/* Growth Report */}
        {userId && (
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <h3 className="font-bold text-gray-900 text-sm">성장 보고서</h3>
            </div>
            <p className="text-xs text-gray-500">기록 데이터를 보고서로 내보내세요. (인쇄/PDF 저장 가능)</p>
            <div className="flex gap-2">
              {[7, 30, 90].map(p => (
                <button
                  key={p}
                  onClick={() => window.open(`/api/report?userId=${userId}&period=${p}`, '_blank')}
                  className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  최근 {p}일
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Account */}
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <h3 className="font-bold text-gray-900 text-sm">계정</h3>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
            icon={<LogOut className="h-4 w-4" />}
          >
            로그아웃
          </Button>
        </Card>

        <div className="h-8" />
      </div>
    </div>
  );
}
