-- ============================================================
-- Sprint D: 또래 비교 기준 데이터
-- 월령별 수유량/수면/기저귀 교체 기준치 (p10, p25, p50, p75, p90)
-- 출처: WHO, AAP, 질병관리청 영유아 건강검진 기준 종합
-- ============================================================

CREATE TABLE IF NOT EXISTS peer_norms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_month_start INT NOT NULL, -- 시작 월령 (inclusive)
  age_month_end INT NOT NULL,   -- 종료 월령 (inclusive)
  metric TEXT NOT NULL CHECK (metric IN (
    'daily_formula_ml', 'daily_breast_count', 'daily_baby_food_ml',
    'daily_sleep_hours', 'daily_diaper_count'
  )),
  p10 NUMERIC NOT NULL,
  p25 NUMERIC NOT NULL,
  p50 NUMERIC NOT NULL, -- 중앙값 (또래 평균)
  p75 NUMERIC NOT NULL,
  p90 NUMERIC NOT NULL,
  source TEXT, -- 출처
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_peer_norms_age_metric ON peer_norms(age_month_start, age_month_end, metric);

-- ============================================================
-- 기준 데이터 삽입
-- 수유량: AAP/WHO 권장 기반 백분위 추정
-- 수면: National Sleep Foundation + 질병관리청
-- 기저귀: 소아과 임상 기준
-- ============================================================

-- === 일일 분유량 (ml) ===
INSERT INTO peer_norms (age_month_start, age_month_end, metric, p10, p25, p50, p75, p90, source) VALUES
(0, 0, 'daily_formula_ml', 300, 400, 500, 600, 700, 'AAP/WHO 신생아'),
(1, 1, 'daily_formula_ml', 450, 550, 650, 750, 850, 'AAP/WHO'),
(2, 2, 'daily_formula_ml', 550, 650, 750, 850, 950, 'AAP/WHO'),
(3, 3, 'daily_formula_ml', 600, 700, 800, 900, 1000, 'AAP/WHO'),
(4, 5, 'daily_formula_ml', 650, 750, 850, 950, 1050, 'AAP/WHO'),
(6, 8, 'daily_formula_ml', 500, 600, 700, 800, 900, 'AAP/WHO 이유식 병행'),
(9, 11, 'daily_formula_ml', 400, 500, 600, 700, 800, 'AAP/WHO 이유식 병행'),
(12, 23, 'daily_formula_ml', 300, 400, 500, 600, 700, 'AAP/WHO 유아기');

-- === 일일 모유 횟수 ===
INSERT INTO peer_norms (age_month_start, age_month_end, metric, p10, p25, p50, p75, p90, source) VALUES
(0, 0, 'daily_breast_count', 6, 8, 10, 12, 14, 'WHO 모유수유 권장'),
(1, 2, 'daily_breast_count', 6, 7, 8, 10, 12, 'WHO'),
(3, 5, 'daily_breast_count', 5, 6, 7, 8, 10, 'WHO'),
(6, 8, 'daily_breast_count', 4, 5, 6, 7, 8, 'WHO 이유식 병행'),
(9, 11, 'daily_breast_count', 3, 4, 5, 6, 7, 'WHO'),
(12, 23, 'daily_breast_count', 2, 3, 4, 5, 6, 'WHO');

-- === 일일 이유식량 (ml) ===
INSERT INTO peer_norms (age_month_start, age_month_end, metric, p10, p25, p50, p75, p90, source) VALUES
(4, 5, 'daily_baby_food_ml', 20, 40, 60, 80, 120, '질병관리청 이유식 초기'),
(6, 8, 'daily_baby_food_ml', 80, 120, 180, 240, 300, '질병관리청 이유식 중기'),
(9, 11, 'daily_baby_food_ml', 150, 200, 300, 400, 500, '질병관리청 이유식 후기'),
(12, 23, 'daily_baby_food_ml', 300, 400, 500, 600, 700, '질병관리청 유아식');

-- === 일일 수면 시간 (hours) ===
INSERT INTO peer_norms (age_month_start, age_month_end, metric, p10, p25, p50, p75, p90, source) VALUES
(0, 0, 'daily_sleep_hours', 12, 14, 16, 17, 18, 'NSF/AAP 신생아'),
(1, 2, 'daily_sleep_hours', 12, 13.5, 15, 16, 17, 'NSF/AAP'),
(3, 5, 'daily_sleep_hours', 11, 12.5, 14, 15, 16, 'NSF/AAP'),
(6, 8, 'daily_sleep_hours', 10, 11.5, 13, 14, 15, 'NSF/AAP'),
(9, 11, 'daily_sleep_hours', 10, 11, 12.5, 13.5, 14.5, 'NSF/AAP'),
(12, 23, 'daily_sleep_hours', 9, 10.5, 12, 13, 14, 'NSF/AAP 유아기');

-- === 일일 기저귀 교체 횟수 ===
INSERT INTO peer_norms (age_month_start, age_month_end, metric, p10, p25, p50, p75, p90, source) VALUES
(0, 0, 'daily_diaper_count', 6, 8, 10, 12, 14, '소아과 임상'),
(1, 2, 'daily_diaper_count', 5, 7, 8, 10, 12, '소아과 임상'),
(3, 5, 'daily_diaper_count', 4, 6, 7, 8, 10, '소아과 임상'),
(6, 8, 'daily_diaper_count', 4, 5, 6, 7, 9, '소아과 임상'),
(9, 11, 'daily_diaper_count', 3, 4, 5, 6, 8, '소아과 임상'),
(12, 23, 'daily_diaper_count', 3, 4, 5, 6, 7, '소아과 임상');
