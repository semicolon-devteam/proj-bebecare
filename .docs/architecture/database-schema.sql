-- ============================================================
-- BebeCare Database Schema
-- Supabase PostgreSQL Migration
--
-- 작성일: 2026-02-07
-- 버전: 1.0
-- 작성자: BebeCare Team
--
-- 실행 순서:
-- 1. Supabase Dashboard → SQL Editor에서 실행
-- 2. 또는 Supabase CLI: supabase db push
-- ============================================================

-- ============================================================
-- 1. Extensions (확장 기능)
-- ============================================================

-- UUID 생성 함수 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Profiles Table (사용자 프로필)
-- Epic 1: 사용자 프로필 관리
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 임신 정보
  is_pregnant BOOLEAN DEFAULT false,
  due_date DATE,

  -- 임신 주차 자동 계산 (Generated Column)
  -- 출산예정일 기준 40주에서 남은 주차 차감
  pregnancy_week INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN due_date IS NOT NULL AND due_date > CURRENT_DATE THEN
        40 - FLOOR(EXTRACT(DAY FROM (due_date - CURRENT_DATE)) / 7)::INTEGER
      ELSE NULL
    END
  ) STORED,

  -- 직장 정보
  is_working BOOLEAN DEFAULT false,

  -- 지역 정보
  region_province VARCHAR(50), -- 시·도 (예: 서울, 부산, 경기)
  region_city VARCHAR(50),     -- 시·군·구 (예: 강남구, 해운대구)

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_is_pregnant ON profiles(is_pregnant);
CREATE INDEX idx_profiles_region ON profiles(region_province, region_city);

-- Row Level Security (RLS) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE profiles IS '사용자 프로필 (임신 정보, 직장, 지역 등)';
COMMENT ON COLUMN profiles.pregnancy_week IS '임신 주차 (자동 계산, 출산예정일 기준)';

-- ============================================================
-- 3. Children Table (자녀 정보)
-- Epic 1: 사용자 프로필 관리
-- ============================================================

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 자녀 정보
  name VARCHAR(100),           -- 이름 (선택사항)
  birth_date DATE NOT NULL,    -- 생년월일 (필수)
  gender VARCHAR(10),          -- 성별: 'male', 'female', 'other'

  -- 개월 수 자동 계산 (Generated Column)
  -- 생년월일 기준으로 현재 개월 수 계산 (30일 = 1개월)
  age_months INTEGER GENERATED ALWAYS AS (
    FLOOR(EXTRACT(DAY FROM (CURRENT_DATE - birth_date)) / 30)::INTEGER
  ) STORED,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_children_birth_date ON children(birth_date);

-- Row Level Security (RLS) 활성화
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 자녀 정보만 조회/수정/삭제 가능
CREATE POLICY "Users can view own children"
  ON children FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own children"
  ON children FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own children"
  ON children FOR DELETE
  USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE children IS '자녀 정보 (생년월일, 성별 등)';
COMMENT ON COLUMN children.age_months IS '개월 수 (자동 계산, 생년월일 기준)';

-- ============================================================
-- 4. Conversations Table (AI 대화 히스토리)
-- Epic 2: AI 기반 맞춤 정보 제공 엔진
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 대화 내용 (JSONB 배열)
  -- 형식: [{ role: 'user'|'assistant', content: string, timestamp: string }]
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 대화 히스토리만 조회/수정 가능
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE conversations IS 'AI 대화 히스토리 (사용자-AI 메시지 저장)';
COMMENT ON COLUMN conversations.messages IS 'JSONB 배열 형식의 대화 메시지 [{ role, content, timestamp }]';

-- ============================================================
-- 5. Timelines Table (시기별 체크리스트)
-- Epic 3: 시기별 체크리스트 및 알림
-- ============================================================

CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 타임라인 정보
  title VARCHAR(200) NOT NULL,              -- 제목 (예: "태아보험 가입")
  description TEXT,                         -- 설명
  category VARCHAR(50) NOT NULL,            -- 카테고리: 'health', 'insurance', 'work', 'preparation', 'feeding', 'milestone'
  priority VARCHAR(20) NOT NULL,            -- 우선순위: 'high', 'medium', 'low'

  -- 일정
  scheduled_date DATE NOT NULL,             -- 예정 날짜
  completed BOOLEAN DEFAULT false,          -- 완료 여부
  completed_at TIMESTAMP WITH TIME ZONE,    -- 완료 시각

  -- 알림 설정
  notification_days INTEGER[] DEFAULT ARRAY[7, 3, 0], -- 알림 전송 일수 (7일 전, 3일 전, 당일)
  notifications_sent INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- 이미 전송된 알림 (중복 방지)

  -- 연결 정보
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- 자녀별 타임라인 (NULL이면 임신부)

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_timelines_user_id ON timelines(user_id);
CREATE INDEX idx_timelines_scheduled_date ON timelines(scheduled_date);
CREATE INDEX idx_timelines_completed ON timelines(completed);
CREATE INDEX idx_timelines_child_id ON timelines(child_id);
CREATE INDEX idx_timelines_category ON timelines(category);

-- Row Level Security (RLS) 활성화
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 타임라인만 조회/수정/삭제 가능
CREATE POLICY "Users can view own timelines"
  ON timelines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timelines"
  ON timelines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timelines"
  ON timelines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timelines"
  ON timelines FOR DELETE
  USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE timelines IS '시기별 체크리스트 (임신 주차별, 육아 개월별)';
COMMENT ON COLUMN timelines.notification_days IS '알림 전송 일수 배열 (예: [7, 3, 0] = 7일 전, 3일 전, 당일)';
COMMENT ON COLUMN timelines.notifications_sent IS '이미 전송된 알림 일수 배열 (중복 방지)';

-- ============================================================
-- 6. Functions (Supabase RPC 함수)
-- ============================================================

-- ========================================
-- 6.1 프로필 생성 시 타임라인 자동 생성 (Trigger 함수)
-- ========================================

CREATE OR REPLACE FUNCTION generate_pregnancy_timeline()
RETURNS TRIGGER AS $$
DECLARE
  current_week INTEGER;
BEGIN
  -- 임신부인 경우
  IF NEW.is_pregnant = true AND NEW.due_date IS NOT NULL THEN
    current_week := NEW.pregnancy_week;

    -- 22주차: 태아보험 가입 마감
    IF current_week <= 22 THEN
      INSERT INTO timelines (user_id, title, description, category, priority, scheduled_date, notification_days)
      VALUES (
        NEW.user_id,
        '태아보험 가입 마감',
        '22주 전 가입 권장',
        'insurance',
        'high',
        NEW.due_date - INTERVAL '18 weeks',
        ARRAY[14, 7, 3, 0]
      );
    END IF;

    -- 24주차: 임신 당뇨 검사
    IF current_week <= 24 THEN
      INSERT INTO timelines (user_id, title, description, category, priority, scheduled_date, notification_days)
      VALUES (
        NEW.user_id,
        '임신 당뇨 검사',
        '24-28주 사이 검사',
        'health',
        'medium',
        NEW.due_date - INTERVAL '16 weeks',
        ARRAY[7, 3, 0]
      );
    END IF;

    -- 34주차: 출산휴가 신청 (직장인만)
    IF current_week <= 34 AND NEW.is_working = true THEN
      INSERT INTO timelines (user_id, title, description, category, priority, scheduled_date, notification_days)
      VALUES (
        NEW.user_id,
        '출산휴가 신청',
        '출산예정일 45일 전',
        'work',
        'high',
        NEW.due_date - INTERVAL '45 days',
        ARRAY[14, 7, 3, 0]
      );
    END IF;

    -- 36주차: 출산 가방 준비
    IF current_week <= 36 THEN
      INSERT INTO timelines (user_id, title, description, category, priority, scheduled_date, notification_days)
      VALUES (
        NEW.user_id,
        '출산 가방 준비 완료',
        '언제든 병원 갈 수 있도록',
        'preparation',
        'high',
        NEW.due_date - INTERVAL '4 weeks',
        ARRAY[7]
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: 프로필 생성 시 타임라인 자동 생성
CREATE TRIGGER trigger_generate_pregnancy_timeline
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_pregnancy_timeline();

-- 코멘트
COMMENT ON FUNCTION generate_pregnancy_timeline IS '프로필 생성 시 임신 주차별 타임라인 자동 생성 (Trigger 함수)';

-- ========================================
-- 6.2 자녀 추가 시 타임라인 자동 생성 (Trigger 함수)
-- ========================================

CREATE OR REPLACE FUNCTION generate_baby_timeline()
RETURNS TRIGGER AS $$
DECLARE
  current_month INTEGER;
BEGIN
  current_month := NEW.age_months;

  -- 1개월: BCG 접종
  IF current_month <= 1 THEN
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      'BCG 접종',
      '결핵 예방접종',
      'health',
      'high',
      NEW.birth_date + INTERVAL '1 month',
      ARRAY[7, 3, 0]
    );
  END IF;

  -- 2개월: DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 1차 접종
  IF current_month <= 2 THEN
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      'DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 1차 접종',
      '국가예방접종',
      'health',
      'high',
      NEW.birth_date + INTERVAL '2 months',
      ARRAY[7, 3, 0]
    );
  END IF;

  -- 4개월: DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 2차 접종
  IF current_month <= 4 THEN
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      'DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 2차 접종',
      '국가예방접종',
      'health',
      'high',
      NEW.birth_date + INTERVAL '4 months',
      ARRAY[7, 3, 0]
    );

    -- 이유식 준비
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      '이유식 준비',
      '6개월부터 시작 예정',
      'feeding',
      'medium',
      NEW.birth_date + INTERVAL '4 months',
      ARRAY[7]
    );
  END IF;

  -- 6개월: 이유식 시작
  IF current_month <= 6 THEN
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      '이유식 시작',
      '초기 이유식 (미음)',
      'feeding',
      'high',
      NEW.birth_date + INTERVAL '6 months',
      ARRAY[7]
    );

    -- DTaP, 폴리오, Hib, 폐렴구균 3차 접종
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      'DTaP, 폴리오, Hib, 폐렴구균 3차 접종',
      '국가예방접종',
      'health',
      'high',
      NEW.birth_date + INTERVAL '6 months',
      ARRAY[7, 3, 0]
    );
  END IF;

  -- 12개월: 첫 돌, MMR, 수두, 일본뇌염 접종
  IF current_month <= 12 THEN
    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      '첫 돌 준비',
      '돌잔치, 돌사진',
      'milestone',
      'medium',
      NEW.birth_date + INTERVAL '12 months',
      ARRAY[30, 14, 7]
    );

    INSERT INTO timelines (user_id, child_id, title, description, category, priority, scheduled_date, notification_days)
    VALUES (
      NEW.user_id,
      NEW.id,
      'MMR, 수두, 일본뇌염 접종',
      '국가예방접종',
      'health',
      'high',
      NEW.birth_date + INTERVAL '12 months',
      ARRAY[7, 3, 0]
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: 자녀 추가 시 타임라인 자동 생성
CREATE TRIGGER trigger_generate_baby_timeline
AFTER INSERT ON children
FOR EACH ROW
EXECUTE FUNCTION generate_baby_timeline();

-- 코멘트
COMMENT ON FUNCTION generate_baby_timeline IS '자녀 추가 시 육아 개월별 타임라인 자동 생성 (Trigger 함수)';

-- ============================================================
-- 7. Updated At Trigger (자동 업데이트)
-- ============================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 적용 (모든 테이블)
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
BEFORE UPDATE ON children
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timelines_updated_at
BEFORE UPDATE ON timelines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. Sample Data (개발 환경 테스트용, 선택사항)
-- ============================================================

-- 주의: 프로덕션에서는 실행하지 않음
-- 개발 환경에서만 테스트용 데이터 삽입

-- ============================================================
-- 마이그레이션 완료
-- ============================================================

-- 실행 완료 확인
SELECT 'BebeCare Database Schema Migration Completed!' AS status;
