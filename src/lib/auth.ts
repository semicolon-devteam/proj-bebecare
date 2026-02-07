import { supabase } from './supabase';
import type { AuthError, User } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

/**
 * 이메일/비밀번호로 회원가입
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    error,
  };
}

/**
 * 이메일/비밀번호로 로그인
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    error,
  };
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 비밀번호 재설정 이메일 전송
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });
  return { error };
}
