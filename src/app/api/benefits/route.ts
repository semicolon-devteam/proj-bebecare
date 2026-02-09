export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 유저 프로필 기반 정부지원 혜택 매칭
 * GET /api/benefits?user_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // auth token으로 유저 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 프로필 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 자녀 정보 가져오기
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id);

    // 정부지원 콘텐츠 가져오기
    const { data: govContents } = await supabase
      .from('contents')
      .select('*')
      .eq('category', 'government_support')
      .order('priority', { ascending: true });

    // 프로필 기반 필터링 + 관련도 점수
    const benefits = (govContents || []).map((content) => {
      let relevanceScore = 0;
      const reasons: string[] = [];

      // 임산부 관련
      if (profile.stage === 'pregnant' || profile.is_pregnant) {
        if (content.title?.includes('임산부') || content.body?.includes('임산부') || content.body?.includes('임신')) {
          relevanceScore += 10;
          reasons.push('임신 중');
        }
      }

      // 출산/육아 관련
      if (children && children.length > 0) {
        relevanceScore += 5;
        reasons.push('자녀 있음');

        const now = new Date();
        for (const child of children) {
          const birthDate = new Date(child.birth_date);
          const ageMonths = Math.floor((now.getTime() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

          // 영아 (0-12개월)
          if (ageMonths <= 12 && (content.body?.includes('부모급여') || content.body?.includes('영아'))) {
            relevanceScore += 8;
            reasons.push(`만 0세 자녀 (${ageMonths}개월)`);
          }

          // 만 0-1세 부모급여
          if (ageMonths <= 23 && content.subcategory === '현금지원') {
            relevanceScore += 5;
          }

          // 아동수당 (만 8세 미만)
          if (ageMonths < 96 && content.title?.includes('아동수당')) {
            relevanceScore += 7;
            reasons.push('아동수당 대상');
          }
        }
      }

      // 직장인 관련
      if (profile.is_working && content.employment_filter) {
        relevanceScore += 6;
        reasons.push('직장인');
      }

      // 지역 관련
      if (profile.region_province && content.region_filter) {
        if (content.region_filter === profile.region_province) {
          relevanceScore += 5;
          reasons.push(`${profile.region_province} 거주`);
        }
      }

      // 기본 점수 (모든 정부지원은 기본 관련)
      relevanceScore += 3;

      return {
        id: content.id,
        title: content.title,
        summary: content.summary,
        body: content.body,
        subcategory: content.subcategory,
        tags: content.tags,
        relevanceScore,
        reasons: [...new Set(reasons)],
      };
    });

    // 관련도 순 정렬
    benefits.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      benefits,
      profile_summary: {
        stage: profile.stage,
        is_working: profile.is_working,
        region: profile.region_province,
        children_count: children?.length || 0,
      },
    });
  } catch (error) {
    console.error('Benefits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
