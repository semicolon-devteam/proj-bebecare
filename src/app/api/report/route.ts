export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generate a growth report as HTML (can be printed to PDF via browser)
 * GET /api/report?userId=xxx&period=7|30|90
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const period = parseInt(req.nextUrl.searchParams.get('period') || '7');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Get profile + children
  const [profileRes, childrenRes] = await Promise.all([
    supabase.from('profiles').select('nickname').eq('user_id', userId).single(),
    supabase.from('children').select('*').eq('user_id', userId).order('created_at'),
  ]);

  const nickname = profileRes.data?.nickname || '사용자';
  const children = childrenRes.data || [];
  const bornChild = children.find((c: Record<string, unknown>) => c.status === 'born');

  // Get logs
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  const { data: logs } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString())
    .order('started_at', { ascending: false });

  const allLogs = logs || [];

  // Aggregate by day
  const dayMap: Record<string, typeof allLogs> = {};
  for (let i = 0; i < period; i++) {
    const d = new Date();
    d.setDate(endDate.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dayMap[ds] = [];
  }
  for (const log of allLogs) {
    const ds = new Date(log.started_at).toISOString().split('T')[0];
    if (dayMap[ds]) dayMap[ds].push(log);
  }

  const days = Object.keys(dayMap).sort();

  // Generate daily summaries
  interface DaySummary {
    date: string;
    formulaMl: number;
    breastCount: number;
    babyFoodMl: number;
    sleepHours: number;
    diaperCount: number;
    bathCount: number;
    medicineCount: number;
  }

  const summaries: DaySummary[] = days.map(day => {
    const dl = dayMap[day];
    const sleepMins = dl.filter(l => l.log_type === 'sleep' && l.ended_at)
      .reduce((s, l) => s + Math.round((new Date(l.ended_at).getTime() - new Date(l.started_at).getTime()) / 60000), 0);
    return {
      date: day,
      formulaMl: dl.filter(l => l.log_type === 'formula').reduce((s, l) => s + (l.amount_ml || 0), 0),
      breastCount: dl.filter(l => l.log_type === 'breast').length,
      babyFoodMl: dl.filter(l => l.log_type === 'baby_food').reduce((s, l) => s + (l.amount_ml || 0), 0),
      sleepHours: Math.round(sleepMins / 6) / 10,
      diaperCount: dl.filter(l => l.log_type === 'diaper').length,
      bathCount: dl.filter(l => l.log_type === 'bath').length,
      medicineCount: dl.filter(l => l.log_type === 'medicine').length,
    };
  });

  const activeDays = summaries.filter(s => s.formulaMl || s.breastCount || s.sleepHours || s.diaperCount);
  const dc = activeDays.length || 1;
  const avgFormula = Math.round(activeDays.reduce((s, d) => s + d.formulaMl, 0) / dc);
  const avgSleep = Math.round(activeDays.reduce((s, d) => s + d.sleepHours, 0) / dc * 10) / 10;
  const avgDiaper = Math.round(activeDays.reduce((s, d) => s + d.diaperCount, 0) / dc * 10) / 10;

  // Child info
  let childInfo = '';
  if (bornChild) {
    const birth = new Date(bornChild.birth_date as string);
    const now = new Date();
    const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    childInfo = `${bornChild.nickname || '아이'} · 생후 ${ageMonths}개월`;
  }

  const reportDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Generate printable HTML
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>BebeCare 성장 보고서</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard Variable', -apple-system, sans-serif; color: #1f2937; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #C2728A; padding-bottom: 24px; }
  .header h1 { color: #C2728A; font-size: 28px; margin-bottom: 4px; }
  .header .subtitle { color: #6b7280; font-size: 14px; }
  .header .child-info { font-size: 16px; font-weight: 600; margin-top: 8px; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 16px; color: #374151; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid #C2728A; }
  .avg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .avg-card { background: #fdf2f8; border-radius: 12px; padding: 16px; text-align: center; }
  .avg-card .value { font-size: 24px; font-weight: 700; color: #C2728A; }
  .avg-card .label { font-size: 11px; color: #9ca3af; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f9fafb; color: #6b7280; font-weight: 600; padding: 8px; text-align: center; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px; text-align: center; border-bottom: 1px solid #f3f4f6; }
  tr:nth-child(even) { background: #fafafa; }
  .footer { margin-top: 32px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <h1>🍼 BebeCare 성장 보고서</h1>
  <div class="subtitle">${reportDate} · 최근 ${period}일</div>
  ${childInfo ? `<div class="child-info">${childInfo}</div>` : ''}
</div>

<div class="section">
  <h2>📊 일평균 요약</h2>
  <div class="avg-grid">
    <div class="avg-card">
      <div class="value">${avgFormula}ml</div>
      <div class="label">일평균 수유량</div>
    </div>
    <div class="avg-card">
      <div class="value">${avgSleep}h</div>
      <div class="label">일평균 수면</div>
    </div>
    <div class="avg-card">
      <div class="value">${avgDiaper}회</div>
      <div class="label">일평균 기저귀</div>
    </div>
  </div>
</div>

<div class="section">
  <h2>📅 일별 상세</h2>
  <table>
    <thead>
      <tr>
        <th>날짜</th>
        <th>🍼 분유(ml)</th>
        <th>🤱 모유</th>
        <th>🥣 이유식(ml)</th>
        <th>😴 수면(h)</th>
        <th>🧷 기저귀</th>
        <th>🛁</th>
        <th>💊</th>
      </tr>
    </thead>
    <tbody>
      ${summaries.reverse().map(s => `
      <tr>
        <td>${s.date.slice(5)}</td>
        <td>${s.formulaMl || '-'}</td>
        <td>${s.breastCount || '-'}</td>
        <td>${s.babyFoodMl || '-'}</td>
        <td>${s.sleepHours || '-'}</td>
        <td>${s.diaperCount || '-'}</td>
        <td>${s.bathCount || '-'}</td>
        <td>${s.medicineCount || '-'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>

<div class="footer">
  <p>BebeCare · 임신·출산·육아 슈퍼앱</p>
  <p>이 보고서는 참고용이며, 정확한 건강 상담은 소아과 전문의에게 문의하세요.</p>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
