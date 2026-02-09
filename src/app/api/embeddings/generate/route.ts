export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createEmbeddings } from '@/lib/embedding';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * contents 테이블의 모든 콘텐츠에 대해 임베딩을 생성하고 저장
 * 일회성 또는 새 콘텐츠 추가 시 호출
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // 임베딩이 없는 콘텐츠만 가져오기
    const { data: contents, error } = await supabase
      .from('contents')
      .select('id, title, summary, body')
      .is('embedding', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!contents || contents.length === 0) {
      return NextResponse.json({ message: 'All contents already have embeddings', count: 0 });
    }

    // 텍스트 결합: title + summary + body (앞부분)
    const texts = contents.map((c) => {
      const combined = `${c.title}\n${c.summary || ''}\n${c.body}`;
      // text-embedding-3-small의 max input은 8192 tokens, 여유있게 자름
      return combined.slice(0, 6000);
    });

    // 배치로 임베딩 생성 (OpenAI는 2048개까지 배치 지원)
    const BATCH_SIZE = 50;
    let totalUpdated = 0;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const batchContents = contents.slice(i, i + BATCH_SIZE);
      
      const embeddings = await createEmbeddings(batch);

      // 각 콘텐츠에 임베딩 저장
      for (let j = 0; j < batchContents.length; j++) {
        const { error: updateError } = await supabase
          .from('contents')
          .update({ embedding: JSON.stringify(embeddings[j]) })
          .eq('id', batchContents[j].id);

        if (updateError) {
          console.error(`Failed to update embedding for ${batchContents[j].id}:`, updateError);
        } else {
          totalUpdated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: contents.length,
      updated: totalUpdated,
    });
  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
