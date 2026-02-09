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
 * 유저 프로필 기반으로 contents 매칭 → timeline_events 생성
 * Vercel Cron 또는 수동 호출
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // 모든 프로필 가져오기
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('onboarding_completed', true);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    let totalCreated = 0;

    for (const profile of profiles || []) {
      const matchedContentIds: string[] = [];
      const stage = profile.stage as string;

      // 1. 임신 계획 단계
      if (stage === 'planning') {
        const { data: contents } = await supabase
          .from('contents')
          .select('id')
          .eq('stage', 'planning')
          .not('id', 'in', `(SELECT content_id FROM timeline_events WHERE user_id = '${profile.user_id}')`);

        contents?.forEach(c => matchedContentIds.push(c.id));
      }

      // 2. 임신 중
      if (stage === 'pregnant' && profile.due_date) {
        const dueDate = new Date(profile.due_date);
        const now = new Date();
        // 임신 시작일 = 출산예정일 - 280일
        const pregnancyStart = profile.pregnancy_start_date
          ? new Date(profile.pregnancy_start_date)
          : new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
        const daysSinceStart = Math.floor((now.getTime() - pregnancyStart.getTime()) / (24 * 60 * 60 * 1000));
        const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7));

        // 현재 주차에 해당하는 콘텐츠
        const { data: contents } = await supabase
          .from('contents')
          .select('id')
          .eq('stage', 'pregnant')
          .lte('week_start', currentWeek)
          .gte('week_end', currentWeek);

        contents?.forEach(c => matchedContentIds.push(c.id));

        // 직장 관련 콘텐츠 (직장인만)
        if (profile.is_working) {
          const { data: workContents } = await supabase
            .from('contents')
            .select('id')
            .eq('category', 'work')
            .eq('employment_filter', true);

          workContents?.forEach(c => matchedContentIds.push(c.id));
        }
      }

      // 3. 산후/육아
      if (stage === 'postpartum' || stage === 'parenting') {
        // 자녀 정보 가져오기
        const { data: children } = await supabase
          .from('children')
          .select('*')
          .eq('user_id', profile.user_id);

        for (const child of children || []) {
          const birthDate = new Date(child.birth_date);
          const now = new Date();
          const ageMonths = Math.floor((now.getTime() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
          const ageWeeks = Math.floor((now.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

          // 산후 콘텐츠 (주차 기반, 0-8주)
          if (ageWeeks <= 8) {
            const { data: postpartumWeek } = await supabase
              .from('contents')
              .select('id')
              .eq('stage', 'postpartum')
              .not('week_start', 'is', null)
              .lte('week_start', ageWeeks)
              .gte('week_end', ageWeeks);

            postpartumWeek?.forEach(c => matchedContentIds.push(c.id));
          }

          // 산후 콘텐츠 (월 기반)
          const { data: postpartumMonth } = await supabase
            .from('contents')
            .select('id')
            .eq('stage', 'postpartum')
            .not('month_start', 'is', null)
            .lte('month_start', ageMonths)
            .gte('month_end', ageMonths);

          postpartumMonth?.forEach(c => matchedContentIds.push(c.id));

          // 육아 콘텐츠 (월 기반)
          const { data: parentingContents } = await supabase
            .from('contents')
            .select('id')
            .eq('stage', 'parenting')
            .not('month_start', 'is', null)
            .lte('month_start', ageMonths)
            .gte('month_end', ageMonths);

          parentingContents?.forEach(c => matchedContentIds.push(c.id));
        }

        // 직장 관련 (직장인만)
        if (profile.is_working) {
          const { data: workContents } = await supabase
            .from('contents')
            .select('id')
            .eq('category', 'work')
            .eq('employment_filter', true);

          workContents?.forEach(c => matchedContentIds.push(c.id));
        }
      }

      // 정부지원: 전국 공통 + 유저 거주지역 매칭
      const { data: govNational } = await supabase
        .from('contents')
        .select('id')
        .eq('category', 'government_support')
        .is('region_filter', null);
      govNational?.forEach(c => matchedContentIds.push(c.id));

      if (profile.region_province) {
        const { data: govRegion } = await supabase
          .from('contents')
          .select('id')
          .eq('category', 'government_support')
          .eq('region_filter', profile.region_province);
        govRegion?.forEach(c => matchedContentIds.push(c.id));

        if (profile.region_city) {
          const { data: govCity } = await supabase
            .from('contents')
            .select('id')
            .eq('category', 'government_support')
            .ilike('title', `%${profile.region_city}%`);
          govCity?.forEach(c => matchedContentIds.push(c.id));
        }
      }

      // 중복 제거
      const uniqueIds = [...new Set(matchedContentIds)];

      // 기존 timeline_events에 없는 것만 삽입
      if (uniqueIds.length > 0) {
        const { data: existing } = await supabase
          .from('timeline_events')
          .select('content_id')
          .eq('user_id', profile.user_id)
          .in('content_id', uniqueIds);

        const existingIds = new Set(existing?.map(e => e.content_id) || []);
        const newIds = uniqueIds.filter(id => !existingIds.has(id));

        if (newIds.length > 0) {
          const inserts = newIds.map(contentId => ({
            user_id: profile.user_id,
            content_id: contentId,
            display_date: today,
          }));

          const { error: insertError } = await supabase
            .from('timeline_events')
            .insert(inserts);

          if (insertError) {
            console.error(`Error inserting timeline for user ${profile.user_id}:`, insertError);
          } else {
            totalCreated += newIds.length;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      profiles_processed: profiles?.length || 0,
      events_created: totalCreated,
    });
  } catch (error) {
    console.error('Timeline generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
