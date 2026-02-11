-- raw_sources: 크롤링/API 원본 데이터 저장소
-- public_data_cache를 대체하고, contents와 연결

CREATE TABLE IF NOT EXISTS raw_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('crawl', 'api', 'manual')),
  source_url TEXT,
  data_type VARCHAR(50) NOT NULL,        -- 'vaccination', 'birth_subsidy', 'government_support', ...
  data_key VARCHAR(100),                 -- 구분키 (예: 접종코드, 지역명)
  raw_data JSONB NOT NULL,               -- 원본 그대로
  checksum VARCHAR(64),                  -- SHA-256 for dedup/change detection
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processed', 'outdated', 'error')),
  error_message TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_type, data_key)
);

CREATE INDEX idx_raw_sources_type ON raw_sources(data_type);
CREATE INDEX idx_raw_sources_status ON raw_sources(status);
CREATE INDEX idx_raw_sources_checksum ON raw_sources(checksum);
CREATE INDEX idx_raw_sources_expires ON raw_sources(expires_at);

ALTER TABLE raw_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage raw_sources" ON raw_sources
  FOR ALL USING (auth.role() = 'service_role');

-- contents에 raw_source_id FK 추가
ALTER TABLE contents ADD COLUMN IF NOT EXISTS raw_source_id UUID REFERENCES raw_sources(id) ON DELETE SET NULL;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

CREATE INDEX idx_contents_raw_source ON contents(raw_source_id);

-- public_data_cache → raw_sources 마이그레이션
INSERT INTO raw_sources (source_type, data_type, data_key, raw_data, source_url, status, fetched_at, expires_at, created_at, updated_at)
SELECT
  'api',
  data_type,
  data_key,
  data,
  source,
  'processed',
  fetched_at,
  expires_at,
  created_at,
  updated_at
FROM public_data_cache
ON CONFLICT (data_type, data_key) DO NOTHING;

-- public_data_cache는 유지하되 deprecated 마킹 (다음 릴리스에서 삭제)
COMMENT ON TABLE public_data_cache IS 'DEPRECATED: migrated to raw_sources. Remove after 2026-03-01.';
