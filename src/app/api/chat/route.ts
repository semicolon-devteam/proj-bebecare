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
function buildSystemPrompt(profile: Record<string, unknown> | null): string {
  let profileSection = '';

  if (profile) {
    const stage = profile.stage as string | null;
    const dueDate = profile.due_date as string | null;
    const pregnancyStart = (profile.pregnancy_start_date ?? profile.pregnancy_start) as string | null;
    const childBirthDate = (profile.birth_date ?? profile.child_birth_date) as string | null;
    const regionProvince = profile.region_province as string | null;
    const regionCity = profile.region_city as string | null;
    const isWorking = profile.is_working as boolean | null;
    const nickname = profile.nickname as string | null;

    // 주차/월령 계산
    let stageInfo = '';
    const now = new Date();
    if (stage === 'pregnant' && pregnancyStart) {
      const start = new Date(pregnancyStart);
      const diffWeeks = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
      stageInfo = `임신 ${diffWeeks}주차`;
      if (dueDate) stageInfo += ` (예정일: ${dueDate})`;
    } else if ((stage === 'postpartum' || stage === 'parenting') && childBirthDate) {
      const birth = new Date(childBirthDate);
      const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (diffMonths < 1) {
        const diffDays = Math.floor((now.getTime() - birth.getTime()) / (24 * 60 * 60 * 1000));
        stageInfo = `출산 ${diffDays}일차 (산후조리기)`;
      } else {
        stageInfo = `아기 ${diffMonths}개월`;
      }
    } else if (stage === 'planning') {
      stageInfo = '임신 준비 중';
    }

    const region = [regionProvince, regionCity].filter(Boolean).join(' ');

    profileSection = `\n## 유저 프로필
${nickname ? `- 닉네임: ${nickname}` : ''}
- 상태: ${stageInfo || stage || '미설정'}
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
 * RAG: 유저 질문으로 관련 콘텐츠 검색
 */
async function searchRelevantContents(query: string): Promise<string> {
  try {
    const queryEmbedding = await createEmbedding(query);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('match_contents', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.3,
      match_count: 5,
    });

    if (error || !data || data.length === 0) {
      return '';
    }

    const context = data
      .map(
        (item: { title: string; category: string; summary: string; body: string; similarity: number }, i: number) =>
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

    // 유저 프로필 조회
    let profile: Record<string, unknown> | null = null;
    if (userId) {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      profile = data;
    }

    // 마지막 유저 메시지로 RAG 검색
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    let systemPrompt = buildSystemPrompt(profile);

    if (lastUserMessage) {
      const context = await searchRelevantContents(lastUserMessage.content);
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
