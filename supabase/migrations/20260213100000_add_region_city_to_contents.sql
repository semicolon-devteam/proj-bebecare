-- contents 테이블에 region_city 컬럼 추가
ALTER TABLE contents ADD COLUMN IF NOT EXISTS region_city TEXT;

-- 기존 정부지원 데이터에서 title 기반으로 시/군/구 파싱
-- 패턴: "도 시/군/구 ..." 형태에서 두 번째 단어 추출
UPDATE contents
SET region_city = (
  CASE
    -- title에서 시/군/구 추출 (예: "경기 수원특례시 출산지원금" → "수원")
    WHEN category = 'government_support' AND region_filter IS NOT NULL THEN
      regexp_replace(
        split_part(title, ' ', 2),
        '(특례시|광역시|특별시|특별자치시|시|군|구)$', ''
      )
    ELSE NULL
  END
)
WHERE category = 'government_support' AND region_filter IS NOT NULL;

-- region_city 인덱스
CREATE INDEX IF NOT EXISTS idx_contents_region_city ON contents(region_city) WHERE region_city IS NOT NULL;
