CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  stage VARCHAR(20),
  week_start INTEGER,
  week_end INTEGER,
  month_start INTEGER,
  month_end INTEGER,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  priority INTEGER DEFAULT 5,
  tags TEXT[],
  region_filter VARCHAR(50),
  employment_filter BOOLEAN,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category);
CREATE INDEX IF NOT EXISTS idx_contents_stage ON contents(stage);
CREATE INDEX IF NOT EXISTS idx_contents_week ON contents(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_contents_month ON contents(month_start, month_end);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read contents" ON contents FOR SELECT USING (auth.role() = 'authenticated');
