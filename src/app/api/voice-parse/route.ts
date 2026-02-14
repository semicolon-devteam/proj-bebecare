export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

const SYSTEM_PROMPT = `너는 아기 돌봄 기록 앱의 음성 입력 파서야.
사용자가 자연어로 말한 내용을 아기 돌봄 기록 데이터로 변환해.

지원하는 기록 타입:
- formula: 분유 (amount_ml 필수)
- baby_food: 이유식 (amount_ml 선택)
- breast: 모유수유
- diaper: 기저귀 (diaper_type: wet/dirty/mixed)
- sleep: 수면 (duration 선택)
- bath: 목욕
- medicine: 투약

JSON으로만 응답해. 다른 텍스트 없이.

응답 형식:
{
  "success": true,
  "logs": [
    {
      "log_type": "formula",
      "amount_ml": 170,
      "diaper_type": null,
      "memo": null,
      "started_at_offset_minutes": 0,
      "duration_minutes": null
    }
  ],
  "confirmation": "분유 170ml 기록할게요"
}

규칙:
- started_at_offset_minutes: 0이면 지금, -30이면 30분 전. "아까", "방금"은 -5~-10 정도.
- "2시에"처럼 특정 시간 언급 시 현재 시간 기준 오프셋 계산 (현재 시간은 메시지에 포함됨)
- duration_minutes: "1시간 잤어" → 60
- 여러 기록 동시 가능: "분유 먹고 기저귀 갈았어" → logs 2개
- 파싱 불가하면: { "success": false, "error": "이해 설명", "confirmation": null, "logs": [] }
- confirmation은 한국어로 간결하게

예시:
"분유 170 먹었어" → formula, 170ml
"기저귀 갈았는데 대변이야" → diaper, dirty
"30분 전에 모유 먹였어" → breast, offset -30
"아기 1시간 잤어" → sleep, duration 60
"목욕시켰어" → bath
"해열제 먹였어" → medicine, memo: "해열제"`;

export async function POST(request: NextRequest) {
  try {
    const { text, currentTime } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '텍스트가 필요합니다' }, { status: 400 });
    }

    const anthropic = getAnthropic();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `현재 시간: ${currentTime || new Date().toISOString()}\n\n"${text}"`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ success: false, error: 'AI 응답 오류' }, { status: 500 });
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Voice parse error:', error);
    return NextResponse.json(
      { success: false, error: '음성 인식 처리 중 오류가 발생했어요' },
      { status: 500 }
    );
  }
}
