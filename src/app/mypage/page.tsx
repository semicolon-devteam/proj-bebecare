'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { getProfile, createOrUpdateProfile } from '@/lib/profile';
import type { ProfileData } from '@/lib/profile';
import { REGION_DATA } from '@/lib/regions';

type Stage = 'planning' | 'pregnant' | 'postpartum';

const stageLabels: Record<Stage, string> = {
  planning: '임신 준비 중',
  pregnant: '임신 중',
  postpartum: '출산 후',
};

const stageEmojis: Record<Stage, string> = {
  planning: '📋',
  pregnant: '🤰',
  postpartum: '👶',
};

export default function MyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [stage, setStage] = useState<Stage>('pregnant');
  const [dueDate, setDueDate] = useState('');
  const [pregnancyStartDate, setPregnancyStartDate] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [regionProvince, setRegionProvince] = useState('');
  const [regionCity, setRegionCity] = useState('');

  // Computed
  const currentWeek = pregnancyStartDate
    ? Math.floor((Date.now() - new Date(pregnancyStartDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) { router.push('/login'); return; }
        setUserId(user.id);

        const profile = await getProfile(user.id);
        if (profile) {
          setStage((profile.stage as Stage) || 'pregnant');
          setDueDate(profile.due_date || '');
          setPregnancyStartDate(profile.pregnancy_start_date || '');
          setChildBirthDate(profile.birth_date || '');
          setIsWorking(profile.is_working || false);
          setRegionProvince(profile.region_province || '');
          setRegionCity(profile.region_city || '');
        }
      } catch (e) {
        console.error(e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // 마지막 생리일 → 예정일/임신시작일 자동 계산
  const handleLastPeriodChange = (val: string) => {
    if (!val) return;
    const lmp = new Date(val);
    const due = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
    setDueDate(due.toISOString().split('T')[0]);
    setPregnancyStartDate(val);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    try {
      const data: ProfileData = {
        stage,
        is_working: isWorking,
        region_province: regionProvince,
        region_city: regionCity,
      };
      if (stage === 'pregnant') {
        data.is_pregnant = true;
        data.due_date = dueDate || null;
        data.pregnancy_start_date = pregnancyStartDate || null;
      } else if (stage === 'postpartum') {
        data.is_pregnant = false;
        data.birth_date = childBirthDate || null;
      } else {
        data.is_pregnant = false;
      }
      await createOrUpdateProfile(userId, data);

      // 타임라인 리셋 (프로필 변경 시 새 콘텐츠 생성)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
        <div className="animate-pulse text-2xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
      {/* Header */}
      <header className="bg-pink-500 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={() => router.push('/')} className="text-white/80 hover:text-white text-2xl">
            ←
          </button>
          <h1 className="text-xl font-black text-white">마이페이지</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* 현재 상태 요약 */}
        <div className="glass rounded-2xl p-6 text-center space-y-2">
          <span className="text-5xl">{stageEmojis[stage]}</span>
          <h2 className="text-2xl font-black text-gray-800">{stageLabels[stage]}</h2>
          {stage === 'pregnant' && currentWeek !== null && (
            <p className="text-lg text-gray-600">
              임신 <span className="font-bold text-pink-600">{currentWeek}주차</span>
              {dueDate && <span className="text-sm ml-2">(예정일: {dueDate})</span>}
            </p>
          )}
          {stage === 'postpartum' && childBirthDate && (
            <p className="text-lg text-gray-600">
              출산일: <span className="font-bold text-blue-600">{childBirthDate}</span>
            </p>
          )}
        </div>

        {/* 상태 변경 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">📌 현재 상태</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['planning', 'pregnant', 'postpartum'] as Stage[]).map((s) => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                  stage === s
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                    : 'glass text-gray-600 hover:bg-white/50'
                }`}
              >
                {stageEmojis[s]} {stageLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* 임신 정보 */}
        {stage === 'pregnant' && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-gray-800">🤰 임신 정보</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">마지막 생리 시작일</label>
                <input
                  type="date"
                  value={pregnancyStartDate}
                  onChange={(e) => handleLastPeriodChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">출산 예정일</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* 출산 후 정보 */}
        {stage === 'postpartum' && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-gray-800">👶 출산 정보</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">출산일</label>
              <input
                type="date"
                value={childBirthDate}
                onChange={(e) => setChildBirthDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {/* 직장 여부 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">💼 직장 여부</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsWorking(true)}
              className={`rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                isWorking
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'glass text-gray-600 hover:bg-white/50'
              }`}
            >
              💼 직장맘
            </button>
            <button
              onClick={() => setIsWorking(false)}
              className={`rounded-xl py-3 text-sm font-bold transition-all duration-300 ${
                !isWorking
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                  : 'glass text-gray-600 hover:bg-white/50'
              }`}
            >
              🏠 전업맘
            </button>
          </div>
        </div>

        {/* 지역 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">📍 지역</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시/도</label>
              <select
                value={regionProvince}
                onChange={(e) => { setRegionProvince(e.target.value); setRegionCity(''); }}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">선택</option>
                {Object.keys(REGION_DATA).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시/군/구</label>
              <select
                value={regionCity}
                onChange={(e) => setRegionCity(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={!regionProvince}
              >
                <option value="">선택</option>
                {(REGION_DATA[regionProvince] || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-lg font-black text-white shadow-xl hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all duration-300"
        >
          {saving ? '저장 중...' : saved ? '✅ 저장 완료!' : '💾 저장하기'}
        </button>

        {/* 계정 관리 */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-gray-800">⚙️ 계정</h3>
          <button
            onClick={handleSignOut}
            className="w-full rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-600 hover:bg-white/50 transition-all duration-300"
          >
            로그아웃
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
