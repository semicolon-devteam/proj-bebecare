/**
 * 사이트 기본 URL
 * 커스텀 도메인 확정 시 NEXT_PUBLIC_SITE_URL 환경변수로 설정
 * 미설정 시 기본값: https://bebecare.vercel.app
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://bebecare.vercel.app';
