import { supabase } from './supabase';

export interface Child {
  id: string;
  user_id: string;
  status: 'expecting' | 'born';
  nickname: string | null;
  name: string | null;
  due_date: string | null;
  pregnancy_start_date: string | null;
  birth_date: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildInput {
  status: 'expecting' | 'born';
  nickname?: string | null;
  name?: string | null;
  due_date?: string | null;
  pregnancy_start_date?: string | null;
  birth_date?: string | null;
  gender?: string | null;
}

/**
 * 사용자의 아이 목록 조회
 */
export async function getChildren(userId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching children:', error);
    return [];
  }
  return (data || []) as Child[];
}

/**
 * 아이 추가
 */
export async function addChild(userId: string, input: ChildInput): Promise<Child | null> {
  const { data, error } = await supabase
    .from('children')
    .insert({
      user_id: userId,
      status: input.status,
      nickname: input.nickname || null,
      name: input.name || null,
      due_date: input.due_date || null,
      pregnancy_start_date: input.pregnancy_start_date || null,
      birth_date: input.birth_date || null,
      gender: input.gender || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding child:', error);
    return null;
  }
  return data as Child;
}

/**
 * 아이 정보 수정
 */
export async function updateChild(childId: string, input: Partial<ChildInput>): Promise<Child | null> {
  const { data, error } = await supabase
    .from('children')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', childId)
    .select()
    .single();

  if (error) {
    console.error('Error updating child:', error);
    return null;
  }
  return data as Child;
}

/**
 * 아이 삭제
 */
export async function deleteChild(childId: string): Promise<boolean> {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId);

  if (error) {
    console.error('Error deleting child:', error);
    return false;
  }
  return true;
}

/**
 * 아이 목록 기반으로 profiles.stage 자동 결정
 */
export function deriveStageFromChildren(children: Child[]): string {
  if (children.some(c => c.status === 'expecting')) return 'pregnant';
  if (children.some(c => c.status === 'born')) return 'postpartum';
  return 'planning';
}

/**
 * 아이 정보를 AI 프롬프트용 텍스트로 변환
 */
export function childrenToPromptText(children: Child[]): string {
  if (children.length === 0) return '';
  const now = new Date();
  return children.map((child, i) => {
    const label = child.nickname || child.name || `${i + 1}번째 아이`;
    if (child.status === 'expecting' && child.pregnancy_start_date) {
      const start = new Date(child.pregnancy_start_date);
      const weeks = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const duePart = child.due_date ? ` (예정일: ${child.due_date})` : '';
      return `- ${label}: 임신 ${weeks}주차${duePart}`;
    } else if (child.status === 'born' && child.birth_date) {
      const birth = new Date(child.birth_date);
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (months < 1) {
        const days = Math.floor((now.getTime() - birth.getTime()) / (24 * 60 * 60 * 1000));
        return `- ${label}: 생후 ${days}일`;
      }
      return `- ${label}: 생후 ${months}개월`;
    }
    return `- ${label}: ${child.status === 'expecting' ? '임신 중' : '출산'}`;
  }).join('\n');
}
