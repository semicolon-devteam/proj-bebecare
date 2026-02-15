import { supabase } from './supabase';

export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  // joined profile info
  nickname?: string;
  email?: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get user's family (if any)
 */
export async function getMyFamily(userId: string): Promise<{ family: Family; members: FamilyMember[] } | null> {
  // First find membership
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', membership.family_id)
    .single();

  if (!family) return null;

  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('joined_at', { ascending: true });

  return {
    family: family as Family,
    members: (members || []) as FamilyMember[],
  };
}

/**
 * Create a new family and add creator as owner
 */
export async function createFamily(userId: string, name?: string): Promise<Family | null> {
  const invite_code = generateInviteCode();

  const { data: family, error: famErr } = await supabase
    .from('families')
    .insert({
      name: name || '우리 가족',
      invite_code,
      created_by: userId,
    })
    .select()
    .single();

  if (famErr || !family) {
    console.error('Error creating family:', famErr);
    return null;
  }

  const { error: memErr } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: userId,
      role: 'owner',
    });

  if (memErr) {
    console.error('Error adding owner:', memErr);
  }

  return family as Family;
}

/**
 * Join a family using invite code
 */
export async function joinFamily(userId: string, inviteCode: string): Promise<{ success: boolean; error?: string }> {
  // Find family by code
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single();

  if (!family) {
    return { success: false, error: '유효하지 않은 초대 코드예요' };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return { success: false, error: '이미 가족 구성원이에요' };
  }

  // Check member limit (max 6)
  const { count } = await supabase
    .from('family_members')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', family.id);

  if ((count || 0) >= 6) {
    return { success: false, error: '가족 구성원이 최대(6명)에 도달했어요' };
  }

  const { error } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: userId,
      role: 'member',
    });

  if (error) {
    return { success: false, error: '가입 중 오류가 발생했어요' };
  }

  return { success: true };
}

/**
 * Leave family
 */
export async function leaveFamily(userId: string, familyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('family_id', familyId)
    .eq('user_id', userId);

  return !error;
}
