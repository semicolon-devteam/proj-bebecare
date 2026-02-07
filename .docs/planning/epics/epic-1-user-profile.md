# Epic 1: 사용자 프로필 관리

> 개인화된 정보 제공을 위한 사용자 데이터 수집 및 관리

**Epic ID**: EPIC-001
**상태**: Planned
**우선순위**: P0 (최우선)
**예상 기간**: 2주 (Sprint 2)

---

## 📋 개요

### 목적
사용자의 임신 상태, 자녀 정보, 직장 여부, 지역 등을 수집하여 AI 맞춤 조언 및 시기별 타임라인 생성의 기초 데이터로 활용

### 핵심 가치
- **개인화의 시작점**: 모든 맞춤 기능의 기반이 되는 데이터
- **사용자 경험**: 간편한 온보딩으로 빠르게 서비스 이용 시작
- **데이터 정확성**: 정확한 프로필 정보로 신뢰할 수 있는 조언 제공

---

## 🎯 사용자 스토리

### Story 1: 임신부 온보딩
**As a** 임신부
**I want to** 임신 주차와 출산예정일을 입력하여
**So that** 내 상황에 맞는 임신 정보와 체크리스트를 받을 수 있다

**Acceptance Criteria**:
- [ ] 온보딩 Step 1: 임신 여부 선택 (임신 중 / 육아 중)
- [ ] 온보딩 Step 2: 출산예정일 선택 (달력 UI)
- [ ] 임신 주차 자동 계산 (출산예정일 기준)
- [ ] 온보딩 완료 후 홈 화면으로 이동

---

### Story 2: 직장인 정보 입력
**As a** 직장인 임신부
**I want to** 직장 여부를 입력하여
**So that** 출산휴가, 육아휴직 등 직장인 맞춤 정보를 받을 수 있다

**Acceptance Criteria**:
- [ ] 온보딩 Step 3: 직장 여부 선택 (근무 중 / 비근무)
- [ ] 직장인 선택 시 출산휴가 정보 제공
- [ ] 비직장인 선택 시 양육수당 정보 제공

---

### Story 3: 지역 정보 입력
**As a** 사용자
**I want to** 거주 지역을 입력하여
**So that** 지역별 정부 지원금, 어린이집 정보를 받을 수 있다

**Acceptance Criteria**:
- [ ] 온보딩 Step 4: 시·도 선택 (드롭다운)
- [ ] 시·군·구 선택 (2단계 드롭다운)
- [ ] 지역 정보는 프로필 수정에서 변경 가능

---

### Story 4: 자녀 정보 입력 (육아 중 사용자)
**As a** 신생아/영유아 부모
**I want to** 자녀 생년월일과 성별을 입력하여
**So that** 아이 개월 수에 맞는 육아 정보와 타임라인을 받을 수 있다

**Acceptance Criteria**:
- [ ] 온보딩 Step 2 (육아 중): 자녀 생년월일 선택
- [ ] 성별 선택 (남 / 여 / 선택 안 함)
- [ ] 여러 자녀 추가 가능 (최대 5명)
- [ ] 아이 개월 수 자동 계산

---

### Story 5: 프로필 수정
**As a** 사용자
**I want to** 프로필 정보를 수정하여
**So that** 변경된 상황을 반영한 정보를 받을 수 있다

**Acceptance Criteria**:
- [ ] 설정 메뉴에서 프로필 수정 페이지 접근
- [ ] 임신 주차, 자녀 정보, 직장, 지역 수정 가능
- [ ] 자녀 추가/삭제 가능
- [ ] 수정 내용 저장 시 타임라인 자동 업데이트

---

## 🛠️ 기술 요구사항

### 데이터베이스 스키마

```sql
-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- 임신 정보
  is_pregnant BOOLEAN DEFAULT false,
  due_date DATE,
  pregnancy_week INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN due_date IS NOT NULL THEN
        40 - FLOOR(EXTRACT(DAY FROM (due_date - CURRENT_DATE)) / 7)
      ELSE NULL
    END
  ) STORED,

  -- 직장 정보
  is_working BOOLEAN DEFAULT false,

  -- 지역 정보
  region_province VARCHAR(50), -- 시·도
  region_city VARCHAR(50), -- 시·군·구

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자녀 정보 테이블
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 자녀 정보
  name VARCHAR(100),
  birth_date DATE NOT NULL,
  gender VARCHAR(10), -- 'male', 'female', 'other'

  -- 개월 수 자동 계산
  age_months INTEGER GENERATED ALWAYS AS (
    FLOOR(EXTRACT(DAY FROM (CURRENT_DATE - birth_date)) / 30)
  ) STORED,

  -- 메타데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- 정책: 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

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
```

---

### API 엔드포인트

#### 1. 프로필 생성/조회
```typescript
// GET /api/profile
// 현재 사용자 프로필 조회
Response: {
  id: string;
  user_id: string;
  is_pregnant: boolean;
  due_date: string | null;
  pregnancy_week: number | null;
  is_working: boolean;
  region_province: string;
  region_city: string;
}

// POST /api/profile
// 프로필 생성 (온보딩)
Request: {
  is_pregnant: boolean;
  due_date?: string;
  is_working: boolean;
  region_province: string;
  region_city: string;
}
```

#### 2. 프로필 수정
```typescript
// PATCH /api/profile
// 프로필 수정
Request: {
  due_date?: string;
  is_working?: boolean;
  region_province?: string;
  region_city?: string;
}
```

#### 3. 자녀 관리
```typescript
// GET /api/children
// 자녀 목록 조회
Response: {
  children: Array<{
    id: string;
    name: string;
    birth_date: string;
    gender: string;
    age_months: number;
  }>;
}

// POST /api/children
// 자녀 추가
Request: {
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
}

// PATCH /api/children/:id
// 자녀 정보 수정

// DELETE /api/children/:id
// 자녀 삭제
```

---

## 🎨 UI/UX 요구사항

### 온보딩 플로우 (4단계)

#### Step 1: 임신 여부 선택
- **UI**: 큰 버튼 2개 (임신 중 / 육아 중)
- **디자인**: 아이콘 + 텍스트, 터치하기 쉬운 크기
- **진행률**: 1/4

#### Step 2-1: 출산예정일 입력 (임신 중 선택 시)
- **UI**: 달력 UI (react-datepicker 또는 네이티브 date input)
- **제약**: 오늘 이후 날짜만 선택 가능
- **진행률**: 2/4

#### Step 2-2: 자녀 생년월일 입력 (육아 중 선택 시)
- **UI**: 달력 UI
- **제약**: 오늘 이전 날짜만 선택 가능
- **진행률**: 2/4

#### Step 3: 직장 여부 선택
- **UI**: 버튼 2개 (근무 중 / 비근무)
- **진행률**: 3/4

#### Step 4: 지역 선택
- **UI**: 드롭다운 2개 (시·도 → 시·군·구)
- **동작**: 시·도 선택 시 시·군·구 옵션 동적 변경
- **진행률**: 4/4

#### 완료 화면
- **UI**: "프로필 설정 완료!" 메시지 + 홈으로 이동 버튼
- **애니메이션**: 체크 아이콘 애니메이션

---

### 프로필 수정 페이지
- **접근**: 설정 메뉴 > 프로필 수정
- **레이아웃**: 폼 형태 (임신 정보, 직장, 지역, 자녀 목록)
- **자녀 관리**: 자녀 카드 리스트, 추가/수정/삭제 버튼

---

## 📊 성공 지표

### 핵심 KPI
- **온보딩 완료율**: 80% 이상 (회원가입 → 프로필 입력 완료)
- **프로필 수정 빈도**: 사용자당 월 평균 0.5회 이상
- **자녀 정보 입력률**: 육아 중 사용자의 90% 이상

### 측정 방법
- Supabase Analytics 또는 Google Analytics 이벤트 트래킹
- 온보딩 각 단계별 이탈률 측정
- 프로필 수정 빈도 측정

---

## 🧪 테스트 계획

### 단위 테스트
- [ ] 임신 주차 자동 계산 로직
- [ ] 아이 개월 수 자동 계산 로직
- [ ] 지역 드롭다운 동적 변경 로직

### 통합 테스트
- [ ] 프로필 생성 API (POST /api/profile)
- [ ] 프로필 조회 API (GET /api/profile)
- [ ] 자녀 CRUD API

### E2E 테스트 (Playwright)
- [ ] 임신부 온보딩 플로우 (Step 1-4 완료)
- [ ] 육아 중 사용자 온보딩 플로우
- [ ] 프로필 수정 플로우
- [ ] 자녀 추가/수정/삭제 플로우

---

## 🚀 구현 계획

### Sprint 2 (2주)

#### Week 1: 온보딩 플로우
- **Day 1-2**: DB 스키마 마이그레이션, Supabase RLS 설정
- **Day 3-4**: 온보딩 UI 컴포넌트 (Step 1-4)
- **Day 5**: 프로필 생성 API 구현

#### Week 2: 프로필 관리 및 자녀 관리
- **Day 1-2**: 프로필 수정 페이지 UI
- **Day 3**: 프로필 수정 API 구현
- **Day 4**: 자녀 CRUD UI 및 API
- **Day 5**: 테스트 및 버그 수정

---

## 📝 체크리스트

### 개발 완료 조건
- [ ] DB 스키마 마이그레이션 완료
- [ ] Supabase RLS 정책 적용
- [ ] 온보딩 4단계 UI 구현
- [ ] 프로필 생성 API 구현
- [ ] 프로필 수정 페이지 구현
- [ ] 자녀 CRUD 기능 구현
- [ ] 단위 테스트 작성 (90% 커버리지)
- [ ] E2E 테스트 작성 (핵심 플로우)

### 품질 검증 조건
- [ ] Lighthouse 점수 >90 (Performance, Accessibility)
- [ ] TypeScript 타입 에러 0개
- [ ] ESLint 경고 0개
- [ ] 온보딩 완료율 80% 이상 (내부 테스트)

---

## 📚 참고 자료

- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hook Form (폼 관리)](https://react-hook-form.com/)

---

**작성일**: 2026-02-07
**작성자**: BebeCare Team
