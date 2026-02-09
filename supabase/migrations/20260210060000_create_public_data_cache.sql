-- 공공 API 데이터 캐시 테이블
CREATE TABLE IF NOT EXISTS public_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type VARCHAR(50) NOT NULL,        -- 'vaccination', 'birth_subsidy'
  data_key VARCHAR(100) NOT NULL,        -- 구분키 (예: 접종코드, 지역명)
  data JSONB NOT NULL,                   -- 캐시된 데이터
  source VARCHAR(200),                   -- 데이터 출처
  fetched_at TIMESTAMPTZ DEFAULT NOW(),  -- API 호출 시점
  expires_at TIMESTAMPTZ,                -- 만료 시점
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_type, data_key)
);

CREATE INDEX idx_public_data_cache_type ON public_data_cache(data_type);
CREATE INDEX idx_public_data_cache_expires ON public_data_cache(expires_at);

-- RLS: 인증된 유저 읽기 가능, 서비스롤만 쓰기
ALTER TABLE public_data_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cache" ON public_data_cache 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Service role can manage cache" ON public_data_cache 
  FOR ALL USING (auth.role() = 'service_role');
