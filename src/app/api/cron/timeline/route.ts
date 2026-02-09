export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Vercel Cron: 매일 09:00 KST에 타임라인 이벤트 생성
 */
export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/timeline/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron timeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
