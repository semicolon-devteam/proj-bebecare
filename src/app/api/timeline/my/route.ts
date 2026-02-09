export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 현재 로그인한 유저의 타임라인을 즉시 생성
 * TimelineFeed에서 이벤트가 없을 때 자동 호출
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];

    // reset=true 시 기존 이벤트 전체 삭제 후 재생성
    const body = await request.json().catch(() => ({}));
    if (body?.reset) {
      await admin.from('timeline_events').delete().eq('user_id', userId);
    }

    // 프로필
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const stage = profile.stage as string;
    const matchedContentIds: string[] = [];

    // 1. 임신 계획
    if (stage === 'planning') {
      const { data } = await admin.from('contents').select('id').eq('stage', 'planning');
      data?.forEach(c => matchedContentIds.push(c.id));
    }

    // 2. 임신 중
    if (stage === 'pregnant' && profile.due_date) {
      const dueDate = new Date(profile.due_date);
      const pregnancyStart = profile.pregnancy_start_date
        ? new Date(profile.pregnancy_start_date)
        : new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
      const daysSinceStart = Math.floor((Date.now() - pregnancyStart.getTime()) / (24 * 60 * 60 * 1000));
      const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7));

      // 현재 주차 ±4주
      const { data } = await admin
        .from('contents')
        .select('id')
        .eq('stage', 'pregnant')
        .lte('week_start', currentWeek + 4)
        .gte('week_end', Math.max(1, currentWeek - 4));
      data?.forEach(c => matchedContentIds.push(c.id));

      if (profile.is_working) {
        const { data: work } = await admin
          .from('contents')
          .select('id')
          .eq('category', 'work')
          .eq('employment_filter', true);
        work?.forEach(c => matchedContentIds.push(c.id));
      }
    }

    // 3. 산후/육아
    if (stage === 'postpartum' || stage === 'parenting') {
      const { data: children } = await admin
        .from('children')
        .select('*')
        .eq('user_id', userId);

      for (const child of children || []) {
        const birthDate = new Date(child.birth_date);
        const ageMonths = Math.floor((Date.now() - birthDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
        const ageWeeks = Math.floor((Date.now() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

        if (ageWeeks <= 12) {
          const { data } = await admin
            .from('contents')
            .select('id')
            .eq('stage', 'postpartum')
            .not('week_start', 'is', null)
            .lte('week_start', ageWeeks + 4)
            .gte('week_end', Math.max(0, ageWeeks - 4));
          data?.forEach(c => matchedContentIds.push(c.id));
        }

        const { data: postM } = await admin
          .from('contents')
          .select('id')
          .eq('stage', 'postpartum')
          .not('month_start', 'is', null)
          .lte('month_start', ageMonths + 3)
          .gte('month_end', Math.max(0, ageMonths - 3));
        postM?.forEach(c => matchedContentIds.push(c.id));

        const { data: parenting } = await admin
          .from('contents')
          .select('id')
          .eq('stage', 'parenting')
          .not('month_start', 'is', null)
          .lte('month_start', ageMonths + 3)
          .gte('month_end', Math.max(0, ageMonths - 3));
        parenting?.forEach(c => matchedContentIds.push(c.id));
      }

      if (profile.is_working) {
        const { data: work } = await admin
          .from('contents')
          .select('id')
          .eq('category', 'work')
          .eq('employment_filter', true);
        work?.forEach(c => matchedContentIds.push(c.id));
      }
    }

    // 정부지원: 전국 공통(region_filter IS NULL) + 유저 거주지역 매칭
    const { data: govNational } = await admin
      .from('contents')
      .select('id')
      .eq('category', 'government_support')
      .is('region_filter', null);
    govNational?.forEach(c => matchedContentIds.push(c.id));

    if (profile.region_province) {
      const { data: govRegion } = await admin
        .from('contents')
        .select('id')
        .eq('category', 'government_support')
        .eq('region_filter', profile.region_province);
      govRegion?.forEach(c => matchedContentIds.push(c.id));

      // 시/군/구 레벨 매칭도 시도
      if (profile.region_city) {
        const { data: govCity } = await admin
          .from('contents')
          .select('id')
          .eq('category', 'government_support')
          .ilike('title', `%${profile.region_city}%`);
        govCity?.forEach(c => matchedContentIds.push(c.id));
      }
    }

    const uniqueIds = [...new Set(matchedContentIds)];
    if (uniqueIds.length === 0) {
      return NextResponse.json({ success: true, created: 0 });
    }

    // 기존 이벤트 제외
    const { data: existing } = await admin
      .from('timeline_events')
      .select('content_id')
      .eq('user_id', userId)
      .in('content_id', uniqueIds);

    const existingIds = new Set(existing?.map(e => e.content_id) || []);
    const newIds = uniqueIds.filter(id => !existingIds.has(id));

    if (newIds.length > 0) {
      const inserts = newIds.map(contentId => ({
        user_id: userId,
        content_id: contentId,
        display_date: today,
      }));

      const { error: insertError } = await admin
        .from('timeline_events')
        .insert(inserts);

      if (insertError) {
        console.error('Timeline insert error:', insertError);
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, created: newIds.length });
  } catch (error) {
    console.error('Timeline my error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
