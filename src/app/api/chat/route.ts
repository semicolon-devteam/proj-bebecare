import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // System prompt for BebeCare AI
    const systemPrompt = `당신은 BebeCare AI 상담사입니다. 임신, 출산, 육아 전문가로서 사용자에게 도움이 되는 조언을 제공합니다.

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Create a readable stream for SSE (Server-Sent Events)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              const data = encoder.encode(`data: ${JSON.stringify({ content })}\n\n`);
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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
