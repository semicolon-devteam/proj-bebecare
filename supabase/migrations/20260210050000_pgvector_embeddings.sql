-- pgvector 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- contents 테이블에 embedding 컬럼 추가
ALTER TABLE contents ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 유사도 검색 인덱스 (IVFFlat — 소규모 데이터셋에 적합)
CREATE INDEX IF NOT EXISTS idx_contents_embedding ON contents
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- 유사도 검색 RPC 함수
CREATE OR REPLACE FUNCTION match_contents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category varchar(50),
  subcategory varchar(100),
  stage varchar(20),
  title varchar(200),
  body text,
  summary text,
  tags text[],
  priority integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.category,
    c.subcategory,
    c.stage,
    c.title,
    c.body,
    c.summary,
    c.tags,
    c.priority,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM contents c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
