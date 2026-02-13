-- 육아 기록 테이블 (베이비타임 스타일)
CREATE TABLE IF NOT EXISTS baby_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('formula', 'baby_food', 'breast', 'diaper', 'sleep', 'bath', 'medicine')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  amount_ml INT,
  diaper_type TEXT CHECK (diaper_type IN ('wet', 'dirty', 'mixed')),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_baby_logs_user_date ON baby_logs(user_id, started_at DESC);
CREATE INDEX idx_baby_logs_child ON baby_logs(child_id, started_at DESC);

-- RLS
ALTER TABLE baby_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own baby logs"
  ON baby_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
