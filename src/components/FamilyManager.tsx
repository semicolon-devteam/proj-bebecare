'use client';

import { useEffect, useState, useCallback } from 'react';
import { getMyFamily, createFamily, joinFamily, leaveFamily, type Family, type FamilyMember } from '@/lib/family';
import { Users, Copy, Check, LogOut, Plus, UserPlus, Crown, User } from 'lucide-react';

interface FamilyManagerProps {
  userId: string;
}

export default function FamilyManager({ userId }: FamilyManagerProps) {
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'create' | 'join'>('view');
  const [inviteInput, setInviteInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getMyFamily(userId);
    if (result) {
      setFamily(result.family);
      setMembers(result.members);
    } else {
      setFamily(null);
      setMembers([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    const fam = await createFamily(userId);
    if (fam) {
      await load();
      setMode('view');
    } else {
      setError('가족 생성에 실패했어요');
    }
    setSaving(false);
  };

  const handleJoin = async () => {
    if (!inviteInput.trim()) return;
    setSaving(true);
    setError('');
    const result = await joinFamily(userId, inviteInput);
    if (result.success) {
      await load();
      setMode('view');
      setInviteInput('');
    } else {
      setError(result.error || '가입 실패');
    }
    setSaving(false);
  };

  const handleLeave = async () => {
    if (!family || !confirm('가족에서 탈퇴하시겠어요?')) return;
    await leaveFamily(userId, family.id);
    await load();
  };

  const copyCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-6">
        <div className="flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-dusty-rose" />
        </div>
      </div>
    );
  }

  // Has family
  if (family) {
    const isOwner = members.find(m => m.user_id === userId)?.role === 'owner';
    return (
      <div className="rounded-xl bg-white border border-gray-100 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-dusty-rose" />
            <h3 className="text-sm font-bold text-gray-900">{family.name}</h3>
          </div>
          <span className="text-xs text-gray-400">{members.length}명</span>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-dusty-rose/10 flex items-center justify-center">
                {m.role === 'owner' ? <Crown className="h-4 w-4 text-dusty-rose" /> : <User className="h-4 w-4 text-dusty-rose" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">
                  {m.user_id === userId ? '나' : `멤버`}
                </p>
                <p className="text-[10px] text-gray-400">{m.role === 'owner' ? '관리자' : '멤버'}</p>
              </div>
              {m.user_id === userId && !isOwner && (
                <button onClick={handleLeave} className="p-1.5 rounded-lg hover:bg-red-50">
                  <LogOut className="h-4 w-4 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Invite code */}
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-[10px] font-semibold text-amber-600 mb-1">초대 코드</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-bold text-amber-800 tracking-widest">{family.invite_code}</span>
            <button onClick={copyCode} className="p-1.5 rounded-lg hover:bg-amber-100">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-amber-500" />}
            </button>
          </div>
          <p className="text-[10px] text-amber-500 mt-1">가족에게 이 코드를 공유하세요</p>
        </div>
      </div>
    );
  }

  // No family - create or join
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">가족 동기화</h3>
      </div>

      {mode === 'view' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">가족과 함께 아이 기록을 공유하세요</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('create')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-dusty-rose py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              가족 만들기
            </button>
            <button
              onClick={() => setMode('join')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border-2 border-dusty-rose py-3 text-sm font-semibold text-dusty-rose hover:bg-dusty-rose/5"
            >
              <UserPlus className="h-4 w-4" />
              초대 코드 입력
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">새 가족 그룹을 만들고 초대 코드를 공유하세요</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setMode('view')} className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-400">
              취소
            </button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-xl bg-dusty-rose py-3 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? '생성 중...' : '만들기'}
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="초대 코드 6자리"
            value={inviteInput}
            onChange={e => setInviteInput(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-mono font-bold tracking-widest placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setMode('view'); setError(''); }} className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-400">
              취소
            </button>
            <button onClick={handleJoin} disabled={saving || inviteInput.length < 6} className="flex-1 rounded-xl bg-dusty-rose py-3 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
