import { supabase } from './supabase';

export interface ProfileData {
  stage?: string;
  onboarding_completed?: boolean;
  is_pregnant?: boolean;
  due_date?: string | null;
  pregnancy_start_date?: string | null;
  birth_date?: string | null;
  is_working?: boolean;
  region_province?: string;
  region_city?: string;
}

export interface ChildData {
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
}

/**
 * 프로필 조회
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * 프로필 생성/업데이트
 */
export async function createOrUpdateProfile(userId: string, profileData: ProfileData) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...profileData, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error(`프로필 업데이트 실패: ${error.message}`);
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ user_id: userId, ...profileData })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      throw new Error(`프로필 생성 실패: ${error.message}`);
    }
    return data;
  }
}

/**
 * 자녀 추가
 */
export async function addChild(userId: string, childData: ChildData) {
  const { data, error } = await supabase
    .from('children')
    .insert({
      user_id: userId,
      name: childData.name,
      birth_date: childData.birth_date,
      gender: childData.gender,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding child:', error);
    return null;
  }
  return data;
}

/**
 * 온보딩 완료 여부 확인
 */
export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single();

  if (error || !data) return false;
  return data.onboarding_completed === true;
}
