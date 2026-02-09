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

const BASE_SYSTEM_PROMPT = `당신은 BebeCare AI 상담사입니다. 임신, 출산, 육아 전문가로서 사용자에게 도움이 되는 조언을 제공합니다.

역할:
- 친절하고 공감적인 태도로 대화합니다
- 임신, 출산, 육아에 관한 정확하고 신뢰할 수 있는 정보를 제공합니다
- 의학적 응급 상황이나 심각한 건강 문제는 즉시 의사 상담을 권장합니다
- 개인의 상황을 존중하고 판단하지 않습니다

대화 스타일:
- 이모지를 적절히 사용하여 친근하게 대화합니다 (예: 👶, 💕, 😊)
- 명확하고 이해하기 쉬운 언어를 사용합니다
- 필요시 단계별로 설명합니다
- 긍정적이고 격려하는 톤을 유지합니다`;

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
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // 마지막 유저 메시지로 RAG 검색
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    let systemPrompt = BASE_SYSTEM_PROMPT;

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
