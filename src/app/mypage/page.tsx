'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getProfile, createOrUpdateProfile } from '@/lib/profile';
import { getChildren, addChild, updateChild, deleteChild, deriveStageFromChildren } from '@/lib/children';
import type { Child, ChildInput } from '@/lib/children';
import { REGION_DATA } from '@/lib/regions';

export default function MyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Children
  const [children, setChildren] = useState<Child[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Add/Edit child form
  const [childStatus, setChildStatus] = useState<'expecting' | 'born'>('expecting');
  const [childNickname, setChildNickname] = useState('');
  const [childDueDate, setChildDueDate] = useState('');
  const [childPregnancyStart, setChildPregnancyStart] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [childGender, setChildGender] = useState('');

  // Profile fields
  const [isWorking, setIsWorking] = useState(false);
  const [regionProvince, setRegionProvince] = useState('');
  const [regionCity, setRegionCity] = useState('');

  // Derived
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
      // Sync stage to profile
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
        <div className="animate-pulse text-2xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
      <header className="bg-pink-500 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={() => router.push('/')} className="text-white/80 hover:text-white text-2xl">←</button>
          <h1 className="text-xl font-black text-white">마이페이지</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 아이 목록 */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">👶 내 아이</h3>
            <button
              onClick={() => { resetChildForm(); setShowAddChild(true); }}
              className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-2 text-sm font-bold text-white"
            >
              + 아이 추가
            </button>
          </div>

          {children.length === 0 ? (
            <p className="text-center text-gray-500 py-4">아직 등록된 아이가 없어요</p>
          ) : (
            <div className="space-y-3">
              {children.map((child) => {
                const week = getChildWeek(child);
                const age = getChildAge(child);
                return (
                  <div key={child.id} className="glass rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{child.status === 'expecting' ? '🤰' : '👶'}</span>
                        <div>
                          <p className="font-bold text-gray-800">{child.nickname || child.name || '이름 없음'}</p>
                          <p className="text-sm text-gray-600">
                            {child.status === 'expecting'
                              ? week !== null ? `임신 ${week}주차` : '임신 중'
                              : age || '출산'}
                            {child.status === 'expecting' && child.due_date && (
                              <span className="ml-2 text-pink-600">예정일: {child.due_date}</span>
                            )}
                            {child.status === 'born' && child.birth_date && (
                              <span className="ml-2 text-blue-600">출산일: {child.birth_date}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditChild(child)} className="text-sm text-purple-600 font-bold">수정</button>
                        <button onClick={() => handleDeleteChild(child.id)} className="text-sm text-red-400 font-bold">삭제</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 아이 추가/수정 폼 */}
        {showAddChild && (
          <div className="glass rounded-2xl p-5 space-y-4 border-2 border-purple-300">
            <h3 className="font-bold text-gray-800">{editingChild ? '✏️ 아이 정보 수정' : '➕ 아이 추가'}</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setChildStatus('expecting')}
                className={`rounded-xl py-3 text-sm font-bold transition-all ${
                  childStatus === 'expecting'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'glass text-gray-600'
                }`}
              >
                🤰 임신 중
              </button>
              <button
                onClick={() => setChildStatus('born')}
                className={`rounded-xl py-3 text-sm font-bold transition-all ${
                  childStatus === 'born'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'glass text-gray-600'
                }`}
              >
                👶 출산 후
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">별명/이름 (선택)</label>
              <input type="text" value={childNickname} onChange={(e) => setChildNickname(e.target.value)}
                placeholder="예: 첫째, 콩이" className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400" />
            </div>

            {childStatus === 'expecting' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">마지막 생리 시작일</label>
                  <input type="date" value={childPregnancyStart} onChange={(e) => handleLastPeriodChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">출산 예정일</label>
                  <input type="date" value={childDueDate} onChange={(e) => setChildDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400" />
                </div>
              </>
            )}

            {childStatus === 'born' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">출산일</label>
                  <input type="date" value={childBirthDate} onChange={(e) => setChildBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="flex gap-2">
                  {[{ value: 'male', label: '👦 남아' }, { value: 'female', label: '👧 여아' }].map((g) => (
                    <button key={g.value} onClick={() => setChildGender(g.value)}
                      className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
                        childGender === g.value ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/50 text-gray-600'
                      }`}>{g.label}</button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowAddChild(false); resetChildForm(); }}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-600">취소</button>
              <button onClick={handleSaveChild} disabled={saving}
                className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-bold text-white disabled:opacity-50">
                {saving ? '저장 중...' : editingChild ? '수정하기' : '추가하기'}
              </button>
            </div>
          </div>
        )}

        {/* 현재 상태 요약 */}
        <div className="glass rounded-2xl p-6 text-center space-y-2">
          <span className="text-5xl">{stage === 'pregnant' ? '🤰' : stage === 'postpartum' ? '👶' : '📋'}</span>
          <h2 className="text-2xl font-black text-gray-800">
            {stage === 'pregnant' ? '임신 중' : stage === 'postpartum' ? '출산 후' : '임신 준비 중'}
          </h2>
          <p className="text-sm text-gray-500">아이 정보 기반으로 자동 설정됩니다</p>
        </div>

        {/* 직장 여부 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">💼 직장 여부</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setIsWorking(true)}
              className={`rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                isWorking ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'glass text-gray-600'
              }`}>💼 직장맘</button>
            <button onClick={() => setIsWorking(false)}
              className={`rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                !isWorking ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' : 'glass text-gray-600'
              }`}>🏠 전업맘</button>
          </div>
        </div>

        {/* 지역 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">📍 지역</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시/도</label>
              <select value={regionProvince} onChange={(e) => { setRegionProvince(e.target.value); setRegionCity(''); }}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="">선택</option>
                {Object.keys(REGION_DATA).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시/군/구</label>
              <select value={regionCity} onChange={(e) => setRegionCity(e.target.value)} disabled={!regionProvince}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="">선택</option>
                {(REGION_DATA[regionProvince] || []).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <button onClick={handleSaveProfile} disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-black text-white shadow-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-300">
          {saving ? '저장 중...' : saved ? '✅ 저장 완료!' : '💾 저장하기'}
        </button>

        {/* 계정 관리 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">⚙️ 계정</h3>
          <button onClick={handleSignOut}
            className="w-full rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-600 hover:bg-white/50 transition-all duration-300">
            로그아웃
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
