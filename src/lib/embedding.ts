import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * 텍스트를 임베딩 벡터로 변환
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });
  return response.data[0].embedding;
}

/**
 * 여러 텍스트를 배치 임베딩
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
