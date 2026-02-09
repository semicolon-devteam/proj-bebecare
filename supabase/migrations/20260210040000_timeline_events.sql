-- timeline_events: 유저별 콘텐츠 매칭 결과 저장
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  
  -- 표시 시점
  display_date DATE NOT NULL,
  
  -- 상태
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_bookmarked BOOLEAN DEFAULT false,
  
  -- 중복 방지
  UNIQUE(user_id, content_id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_user ON timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_display ON timeline_events(user_id, display_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_events_unread ON timeline_events(user_id, is_read, is_dismissed);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline_events" ON timeline_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own timeline_events" ON timeline_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage timeline_events" ON timeline_events FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 함수 (없으면 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timeline_events_updated_at
BEFORE UPDATE ON timeline_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
