export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { createEmbedding } from '@/lib/embedding';

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 유저 프로필 기반 동적 시스템 프롬프트 생성
 */
function buildSystemPrompt(profile: Record<string, unknown> | null, children: Record<string, unknown>[] = []): string {
  let profileSection = '';

  if (profile) {
    const stage = profile.stage as string | null;
    const regionProvince = profile.region_province as string | null;
    const regionCity = profile.region_city as string | null;
    const isWorking = profile.is_working as boolean | null;
    const nickname = profile.nickname as string | null;

    // 아이 정보 기반 상태 텍스트 생성
    let childrenInfo = '';
    const now = new Date();
    if (children.length > 0) {
      const lines = children.map((child, i) => {
        const label = (child.nickname as string) || (child.name as string) || `${i + 1}번째 아이`;
        const status = child.status as string;
        const pregnancyStart = child.pregnancy_start_date as string | null;
        const dueDate = child.due_date as string | null;
        const birthDate = child.birth_date as string | null;

        if (status === 'expecting' && pregnancyStart) {
          const start = new Date(pregnancyStart);
          const weeks = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const duePart = dueDate ? ` (예정일: ${dueDate})` : '';
          return `- ${label}: 임신 ${weeks}주차${duePart}`;
        } else if (status === 'born' && birthDate) {
          const birth = new Date(birthDate);
          const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
          if (diffMonths < 1) {
            const diffDays = Math.floor((now.getTime() - birth.getTime()) / (24 * 60 * 60 * 1000));
            return `- ${label}: 생후 ${diffDays}일`;
          }
          return `- ${label}: 생후 ${diffMonths}개월`;
        }
        return `- ${label}: ${status === 'expecting' ? '임신 중' : '출산'}`;
      });
      childrenInfo = `\n### 아이 정보\n${lines.join('\n')}`;
    } else {
      // Fallback to profile-level data
      const dueDate = profile.due_date as string | null;
      const pregnancyStart = (profile.pregnancy_start_date ?? profile.pregnancy_start) as string | null;
      const childBirthDate = (profile.birth_date ?? profile.child_birth_date) as string | null;
      let stageInfo = '';
      if (stage === 'pregnant' && pregnancyStart) {
        const start = new Date(pregnancyStart);
        const diffWeeks = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
        stageInfo = `임신 ${diffWeeks}주차`;
        if (dueDate) stageInfo += ` (예정일: ${dueDate})`;
      } else if ((stage === 'postpartum' || stage === 'parenting') && childBirthDate) {
        const birth = new Date(childBirthDate);
        const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        stageInfo = diffMonths < 1 ? `출산 ${Math.floor((now.getTime() - birth.getTime()) / (24 * 60 * 60 * 1000))}일차` : `아기 ${diffMonths}개월`;
      } else if (stage === 'planning') {
        stageInfo = '임신 준비 중';
      }
      childrenInfo = stageInfo ? `\n- 상태: ${stageInfo}` : '';
    }

    const region = [regionProvince, regionCity].filter(Boolean).join(' ');

    profileSection = `\n## 유저 프로필
${nickname ? `- 닉네임: ${nickname}` : ''}
- 단계: ${stage || '미설정'}${childrenInfo}
${region ? `- 지역: ${region}` : ''}
${isWorking ? '- 직장맘: Y' : ''}
`.replace(/\n{3,}/g, '\n\n');
  }

  return `## 역할
BebeCare 임신·출산·육아 AI 상담사. 따뜻하고 신뢰할 수 있는 전문 상담사로서, 유저의 현재 시기에 맞는 정보를 제공한다.
${profileSection}
## 규칙
1. 의학적 진단·처방 절대 불가 → "담당 의사와 상담하세요" 안내
2. 응급 증상 키워드(출혈, 파수, 태동 감소, 고열, 경련 등) → 즉시 병원 방문 강력 권고
3. 참고자료(RAG) 기반 답변 우선. 없으면 일반 지식으로 보충하되 자연스럽게 통합
4. 유저의 현재 주차/월령에 맞는 맥락 유지 — 시기에 안 맞는 정보는 시기를 명시
5. 지역 정보가 있으면 해당 지역 혜택/기관 우선 안내
6. 불확실한 정보에는 "정확한 내용은 확인이 필요합니다" 명시

## 대화 스타일
- 이모지 적절히 사용 (👶 💕 😊)
- 명확하고 쉬운 언어. 의학 용어는 괄호로 설명 추가
- 필요시 단계별 설명
- 긍정적·격려하는 톤이되, 과장하지 않음`;
}

/**
 * 멀티턴 RAG 검색 쿼리 생성: 최근 유저 메시지 2-3개를 합침
 */
function buildSearchQuery(messages: { role: string; content: string }[]): string {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .slice(-3) // 최근 3개
    .map((m) => m.content);
  return userMessages.join(' ');
}

/** stage에 맞는 콘텐츠를 부스트하여 재정렬 */
interface RagItem {
  id: string;
  title: string;
  category: string;
  stage: string | null;
  summary: string;
  body: string;
  similarity: number;
}

function rerankByStage(items: RagItem[], userStage: string | null, children: Record<string, unknown>[] = []): RagItem[] {
  if (!userStage && children.length === 0) return items;

  // Collect all relevant stages from children + profile
  const relevantStages = new Set(['all']);
  if (userStage) relevantStages.add(userStage);
  for (const child of children) {
    if (child.status === 'expecting') { relevantStages.add('pregnant'); relevantStages.add('pregnancy'); }
    if (child.status === 'born') { relevantStages.add('postpartum'); relevantStages.add('parenting'); }
  }

  return items
    .map((item) => ({
      ...item,
      // stage 일치 시 유사도 0.1 부스트
      boostedSimilarity:
        item.similarity + (item.stage && relevantStages.has(item.stage) ? 0.1 : 0),
    }))
    .sort((a, b) => b.boostedSimilarity - a.boostedSimilarity)
    .slice(0, 5); // top-5 유지
}

/**
 * RAG: 멀티턴 검색 + 카테고리 필터링
 */
async function searchRelevantContents(
  messages: { role: string; content: string }[],
  userStage: string | null,
  children: Record<string, unknown>[] = []
): Promise<string> {
  try {
    const query = buildSearchQuery(messages);
    if (!query.trim()) return '';

    const queryEmbedding = await createEmbedding(query);
    const supabase = getSupabaseAdmin();

    // 더 많이 가져와서 reranking
    const { data, error } = await supabase.rpc('match_contents', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.25,
      match_count: 10,
    });

    if (error || !data || data.length === 0) {
      return '';
    }

    const reranked = rerankByStage(data as RagItem[], userStage, children);

    const context = reranked
      .map(
        (item, i) =>
          `[참고자료 ${i + 1}] (카테고리: ${item.category}, 유사도: ${(item.similarity * 100).toFixed(0)}%)\n제목: ${item.title}\n요약: ${item.summary || ''}\n내용: ${item.body}`
      )
      .join('\n\n---\n\n');

    return context;
  } catch (error) {
    console.error('RAG search error:', error);
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // 유저 프로필 + 아이 정보 조회
    let profile: Record<string, unknown> | null = null;
    let childrenData: Record<string, unknown>[] = [];
    if (userId) {
      const supabase = getSupabaseAdmin();
      const [profileRes, childrenRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('children').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      ]);
      profile = profileRes.data;
      childrenData = (childrenRes.data || []) as Record<string, unknown>[];
    }

    // 아기 기록 데이터 컨텍스트 조회 (최근 7일)
    let babyLogContext = '';
    if (userId) {
      const supabase = getSupabaseAdmin();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: recentLogs } = await supabase
        .from('baby_logs')
        .select('log_type, started_at, ended_at, amount_ml, diaper_type, memo')
        .eq('user_id', userId)
        .gte('started_at', sevenDaysAgo.toISOString())
        .order('started_at', { ascending: false })
        .limit(50);

      if (recentLogs && recentLogs.length > 0) {
        // Summarize by day
        const dayMap: Record<string, typeof recentLogs> = {};
        for (const log of recentLogs) {
          const day = new Date(log.started_at).toISOString().split('T')[0];
          if (!dayMap[day]) dayMap[day] = [];
          dayMap[day].push(log);
        }

        const lines: string[] = [];
        for (const [day, logs] of Object.entries(dayMap).sort().reverse().slice(0, 3)) {
          const formulaMl = logs.filter(l => l.log_type === 'formula').reduce((s, l) => s + (l.amount_ml || 0), 0);
          const breastCount = logs.filter(l => l.log_type === 'breast').length;
          const sleepMins = logs.filter(l => l.log_type === 'sleep' && l.ended_at)
            .reduce((s, l) => s + Math.round((new Date(l.ended_at!).getTime() - new Date(l.started_at).getTime()) / 60000), 0);
          const diaperCount = logs.filter(l => l.log_type === 'diaper').length;
          const parts: string[] = [];
          if (formulaMl) parts.push(`분유 ${formulaMl}ml`);
          if (breastCount) parts.push(`모유 ${breastCount}회`);
          if (sleepMins) parts.push(`수면 ${Math.floor(sleepMins/60)}시간${sleepMins%60}분`);
          if (diaperCount) parts.push(`기저귀 ${diaperCount}회`);
          if (parts.length > 0) lines.push(`${day}: ${parts.join(', ')}`);
        }

        if (lines.length > 0) {
          // Also get peer norms for context
          let peerContext = '';
          const bornChild = childrenData.find(c => c.status === 'born' && c.birth_date);
          if (bornChild) {
            const birth = new Date(bornChild.birth_date as string);
            const now = new Date();
            const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
            const { data: norms } = await supabase
              .from('peer_norms')
              .select('metric, p25, p50, p75')
              .lte('age_month_start', ageMonths)
              .gte('age_month_end', ageMonths);
            if (norms && norms.length > 0) {
              const normLines = norms.map(n => {
                const labels: Record<string, string> = {
                  daily_formula_ml: '분유(ml/일)',
                  daily_breast_count: '모유(회/일)',
                  daily_sleep_hours: '수면(시간/일)',
                  daily_diaper_count: '기저귀(회/일)',
                  daily_baby_food_ml: '이유식(ml/일)',
                };
                return `${labels[n.metric] || n.metric}: 25%ile=${n.p25}, 평균=${n.p50}, 75%ile=${n.p75}`;
              });
              peerContext = `\n또래 기준 (${ageMonths}개월): ${normLines.join(' | ')}`;
            }
          }

          babyLogContext = `\n\n## 최근 기록 데이터\n${lines.join('\n')}${peerContext}\n\n이 데이터를 참고하여 아이의 수유/수면/배변 패턴에 대한 질문에 구체적으로 답변하세요. 또래 기준과 비교하여 조언할 수 있습니다.`;
        }
      }
    }

    // 멀티턴 RAG 검색 (최근 유저 메시지 2-3개 합산)
    const userStage = (profile?.stage as string) || null;
    let systemPrompt = buildSystemPrompt(profile, childrenData) + babyLogContext;

    {
      const context = await searchRelevantContents(messages, userStage, childrenData);
      if (context) {
        systemPrompt += `\n\n## 참고자료 (BebeCare 검증된 데이터)

아래는 사용자의 질문과 관련된 BebeCare의 검증된 참고자료입니다. 답변 시 이 자료를 우선적으로 활용하세요.
참고자료에 없는 내용은 일반 의학 지식으로 보충하되, 참고자료 기반 내용과 일반 지식을 구분하지 않고 자연스럽게 통합하여 답변하세요.

${context}`;
      }
    }

    const anthropic = getAnthropic();

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const data = encoder.encode(
                `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
              );
              controller.enqueue(data);
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
