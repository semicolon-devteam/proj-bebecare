-- ============================================================
-- 아이 중심 아키텍처: children 테이블 확장
-- ============================================================

-- 1. age_months generated column 제거 (birth_date NOT NULL 의존)
ALTER TABLE children DROP COLUMN IF EXISTS age_months;

-- 2. birth_date NOT NULL 제약 해제
ALTER TABLE children ALTER COLUMN birth_date DROP NOT NULL;

-- 3. 새 컬럼 추가
ALTER TABLE children ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'born' CHECK (status IN ('expecting', 'born'));
ALTER TABLE children ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);
ALTER TABLE children ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS pregnancy_start_date DATE;

-- 4. 기존 데이터 마이그레이션: Reus 프로필 → children
INSERT INTO children (user_id, status, nickname, due_date, pregnancy_start_date, birth_date, gender)
SELECT
  '9da88c2a-22a2-4606-810c-def6d503c5a4',
  'expecting',
  '첫째',
  '2026-05-14'::DATE,
  '2025-08-07'::DATE,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM children WHERE user_id = '9da88c2a-22a2-4606-810c-def6d503c5a4'
);
