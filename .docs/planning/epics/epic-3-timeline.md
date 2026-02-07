# Epic 3: 시기별 체크리스트 및 알림

> 사용자가 중요 일정을 놓치지 않도록 선제적으로 안내하는 타임라인 및 알림 시스템

**Epic ID**: EPIC-003
**상태**: Planned
**우선순위**: P0 (최우선)
**예상 기간**: 2주 (Sprint 5)
**의존성**: Epic 1 (사용자 프로필) 완료 필요

---

## 📋 개요

### 목적
사용자 프로필(임신 주차, 자녀 개월)을 기반으로 시기별 체크리스트를 자동 생성하고, 중요 일정을 푸시 알림으로 선제적 안내

### 핵심 가치
- **놓치지 않는 육아**: 태아보험, 예방접종, 출생신고 등 중요 일정을 앱이 먼저 알림
- **개인화된 타임라인**: 각 사용자의 임신 주차/아이 개월에 맞춘 맞춤 일정
- **스트레스 감소**: "혹시 놓친 게 있을까?" 걱정 해소

---

## 🎯 사용자 스토리

### Story 1: 타임라인 자동 생성 (임신부)
**As a** 임신부
**I want to** 출산예정일을 입력하면 임신 주차별 체크리스트가 자동으로 생성되어
**So that** 각 주차에 해야 할 일을 한눈에 확인할 수 있다

**Acceptance Criteria**:
- [ ] 온보딩 완료 시 타임라인 자동 생성
- [ ] 임신 주차별 체크리스트 포함 (예: 22주 태아보험, 34주 출산휴가)
- [ ] 홈 화면에 "이번 주 할 일", "다음 주 할 일" 표시
- [ ] 완료한 항목은 체크 표시

**예시 타임라인**:
```
[22주차]
✅ 태아보험 가입 상담 예약
⬜ 2차 기형아 검사 (쿼드 검사)

[24주차]
⬜ 임신 당뇨 검사

[28주차]
⬜ 출산 준비물 리스트 작성

[34주차]
⬜ 출산휴가 신청 (45일 전)
⬜ 산후조리원 예약 확인
```

---

### Story 2: 타임라인 자동 생성 (신생아 부모)
**As a** 신생아 부모
**I want to** 자녀 생년월일을 입력하면 개월별 체크리스트가 자동으로 생성되어
**So that** 예방접종, 발달 확인 등 놓치지 않고 관리할 수 있다

**Acceptance Criteria**:
- [ ] 자녀 정보 입력 시 타임라인 자동 생성
- [ ] 개월별 체크리스트 포함 (예: 2개월 예방접종, 6개월 이유식)
- [ ] 여러 자녀의 타임라인 통합 표시

**예시 타임라인**:
```
[생후 2개월]
⬜ DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 1차 접종

[생후 4개월]
⬜ DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 2차 접종
⬜ 이유식 준비 (6개월부터 시작)

[생후 6개월]
⬜ DTaP, 폴리오, Hib, 폐렴구균 3차 접종
⬜ 이유식 시작 (초기)

[생후 12개월]
⬜ 첫 돌 준비
⬜ MMR, 수두, 일본뇌염 접종
```

---

### Story 3: 푸시 알림
**As a** 사용자
**I want to** 중요 일정 1주일 전, 3일 전, 당일에 알림을 받아서
**So that** 일정을 놓치지 않을 수 있다

**Acceptance Criteria**:
- [ ] 중요 일정 (예방접종, 태아보험 마감 등) 1주일 전 알림
- [ ] 3일 전 재알림
- [ ] 당일 알림
- [ ] 알림 설정에서 ON/OFF 가능
- [ ] 알림 시간대 설정 가능 (예: 오전 9시)

**예시 알림**:
```
📌 [1주일 전]
"생후 2개월 예방접종이 다가옵니다. 소아과 예약하셨나요?"

📌 [3일 전]
"생후 2개월 예방접종이 3일 남았습니다. (DTaP, 폴리오 등)"

📌 [당일]
"오늘은 예방접종 날입니다! 잊지 말고 병원 가세요."
```

---

### Story 4: 체크리스트 완료 처리
**As a** 사용자
**I want to** 완료한 일정을 체크하여
**So that** 남은 할 일을 명확히 파악할 수 있다

**Acceptance Criteria**:
- [ ] 타임라인 항목 클릭 시 완료/미완료 토글
- [ ] 완료한 항목은 회색 처리 + 체크 아이콘
- [ ] 완료율 표시 (예: "이번 주 3/5 완료")

---

## 🛠️ 기술 요구사항

### 타임라인 생성 로직

#### 임신 주차별 타임라인 템플릿
```typescript
const pregnancyTimeline = [
  {
    week: 11,
    title: '1차 기형아 검사',
    description: '목덜미 투명대 검사 (11-13주)',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0] // 7일 전, 3일 전, 당일
  },
  {
    week: 16,
    title: '2차 기형아 검사',
    description: '쿼드 검사',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  },
  {
    week: 20,
    title: '정밀 초음파',
    description: '기형 확인',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  },
  {
    week: 22,
    title: '태아보험 가입 마감',
    description: '22주 전 가입 권장',
    category: 'insurance',
    priority: 'high',
    notification_days: [14, 7, 3, 0] // 2주 전부터 알림
  },
  {
    week: 24,
    title: '임신 당뇨 검사',
    description: '24-28주 사이 검사',
    category: 'health',
    priority: 'medium',
    notification_days: [7, 3, 0]
  },
  {
    week: 28,
    title: '출산 준비물 리스트 작성',
    description: '병원 가방, 신생아 용품 준비',
    category: 'preparation',
    priority: 'medium',
    notification_days: [7]
  },
  {
    week: 32,
    title: '산후조리원 예약',
    description: '만실 대비 미리 예약',
    category: 'preparation',
    priority: 'medium',
    notification_days: [7]
  },
  {
    week: 34,
    title: '출산휴가 신청',
    description: '출산예정일 45일 전',
    category: 'work',
    priority: 'high',
    notification_days: [14, 7, 3, 0]
  },
  {
    week: 36,
    title: '출산 가방 준비 완료',
    description: '언제든 병원 갈 수 있도록',
    category: 'preparation',
    priority: 'high',
    notification_days: [7]
  }
];
```

#### 육아 개월별 타임라인 템플릿
```typescript
const babyTimeline = [
  {
    month: 1,
    title: 'BCG 접종',
    description: '결핵 예방접종',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  },
  {
    month: 2,
    title: 'DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 1차 접종',
    description: '국가예방접종',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  },
  {
    month: 4,
    title: 'DTaP, 폴리오, Hib, 폐렴구균, 로타바이러스 2차 접종',
    description: '국가예방접종',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  },
  {
    month: 4,
    title: '이유식 준비',
    description: '6개월부터 시작 예정',
    category: 'feeding',
    priority: 'medium',
    notification_days: [7]
  },
  {
    month: 6,
    title: 'DTaP, 폴리오, Hib, 폐렴구균 3차 접종',
    description: '국가예방접종',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  },
  {
    month: 6,
    title: '이유식 시작',
    description: '초기 이유식 (미음)',
    category: 'feeding',
    priority: 'high',
    notification_days: [7]
  },
  {
    month: 12,
    title: '첫 돌 준비',
    description: '돌잔치, 돌사진',
    category: 'milestone',
    priority: 'medium',
    notification_days: [30, 14, 7] // 한 달 전부터
  },
  {
    month: 12,
    title: 'MMR, 수두, 일본뇌염 접종',
    description: '국가예방접종',
    category: 'health',
    priority: 'high',
    notification_days: [7, 3, 0]
  }
];
```

---

### 데이터베이스 스키마

```sql
-- 타임라인 테이블
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 타임라인 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'health', 'insurance', 'work', 'preparation', etc.
  priority VARCHAR(20) NOT NULL, -- 'high', 'medium', 'low'

  -- 일정
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,

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

-- RLS 정책
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timelines"
  ON timelines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own timelines"
  ON timelines FOR UPDATE
  USING (auth.uid() = user_id);
```

---

### API 엔드포인트

#### 1. 타임라인 자동 생성
```typescript
// POST /api/timelines/generate
// 사용자 프로필 기반 타임라인 자동 생성 (온보딩 시 호출)
Response: {
  count: number; // 생성된 타임라인 개수
}

// 구현 로직
export async function POST(request: Request) {
  const user = await getUser();

  // 1. 프로필 조회
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const timelines = [];

  // 2. 임신부인 경우
  if (profile.is_pregnant && profile.due_date) {
    const currentWeek = profile.pregnancy_week;

    // 현재 주차 이후의 타임라인 생성
    pregnancyTimeline
      .filter(t => t.week >= currentWeek)
      .forEach(template => {
        const scheduledDate = calculateWeekDate(profile.due_date, template.week);
        timelines.push({
          user_id: user.id,
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          scheduled_date: scheduledDate,
          notification_days: template.notification_days
        });
      });
  }

  // 3. 자녀가 있는 경우
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', user.id);

  children.forEach(child => {
    const currentMonth = child.age_months;

    babyTimeline
      .filter(t => t.month >= currentMonth)
      .forEach(template => {
        const scheduledDate = calculateMonthDate(child.birth_date, template.month);
        timelines.push({
          user_id: user.id,
          child_id: child.id,
          title: template.title,
          description: template.description,
          category: template.category,
          priority: template.priority,
          scheduled_date: scheduledDate,
          notification_days: template.notification_days
        });
      });
  });

  // 4. DB 저장
  await supabase.from('timelines').insert(timelines);

  return { count: timelines.length };
}
```

---

#### 2. 타임라인 조회
```typescript
// GET /api/timelines
// 사용자 타임라인 조회 (홈 화면)
Response: {
  this_week: Array<Timeline>; // 이번 주 할 일
  next_week: Array<Timeline>; // 다음 주 할 일
  upcoming: Array<Timeline>; // 향후 일정
}
```

---

#### 3. 체크리스트 완료 처리
```typescript
// PATCH /api/timelines/:id
// 체크리스트 완료/미완료 토글
Request: {
  completed: boolean;
}
```

---

### 푸시 알림 구현

#### Supabase Edge Function (매일 실행)
```typescript
// supabase/functions/send-notifications/index.ts
// Cron Job으로 매일 실행 (예: 매일 오전 9시)

export async function handler() {
  const today = new Date();

  // 1. 오늘 알림을 보내야 할 타임라인 조회
  const { data: timelines } = await supabase
    .from('timelines')
    .select('*, users!inner(*)')
    .eq('completed', false)
    .is('child_id', null) // 임신부 타임라인만 (간소화)
    .returns<Timeline[]>();

  timelines.forEach(async timeline => {
    const daysUntil = differenceInDays(timeline.scheduled_date, today);

    // 2. 알림 전송 대상인지 확인
    if (
      timeline.notification_days.includes(daysUntil) &&
      !timeline.notifications_sent.includes(daysUntil)
    ) {
      // 3. 푸시 알림 전송 (OneSignal 또는 Firebase Cloud Messaging)
      await sendPushNotification(timeline.user.device_token, {
        title: getNotificationTitle(daysUntil),
        body: timeline.title,
        data: { timeline_id: timeline.id }
      });

      // 4. 알림 전송 기록 업데이트
      await supabase
        .from('timelines')
        .update({
          notifications_sent: [...timeline.notifications_sent, daysUntil]
        })
        .eq('id', timeline.id);
    }
  });
}
```

---

## 🎨 UI/UX 요구사항

### 홈 화면 타임라인 섹션
- **레이아웃**:
  - "이번 주 할 일" (카드 리스트)
  - "다음 주 할 일" (카드 리스트)
  - "향후 일정" (타임라인 뷰)
- **카드 디자인**:
  - 체크박스 + 제목 + 일정 날짜
  - 카테고리 아이콘 (건강, 보험, 직장 등)
  - 우선순위 색상 (높음: 빨강, 중간: 주황, 낮음: 회색)
- **완료 처리**: 체크박스 클릭 시 완료/미완료 토글, 애니메이션

### 타임라인 상세 페이지
- **정보**: 제목, 설명, 일정 날짜, 카테고리, 우선순위
- **액션**: 완료 처리, 일정 수정, AI 챗봇 연결 (관련 질문)

---

## 📊 성공 지표

### 핵심 KPI
- **타임라인 체크 완료율**: 70% 이상 (생성된 체크리스트 중 완료 비율)
- **푸시 알림 도달률**: 90% 이상
- **푸시 알림 클릭률**: 30% 이상

### 측정 방법
- Supabase Analytics 또는 Google Analytics 이벤트 트래킹
- 푸시 알림 서비스 대시보드 (OneSignal, FCM)

---

## 🧪 테스트 계획

### 단위 테스트
- [ ] 타임라인 생성 로직 (임신 주차별, 육아 개월별)
- [ ] 일정 날짜 계산 로직
- [ ] 알림 전송 대상 필터링 로직

### 통합 테스트
- [ ] 타임라인 자동 생성 API
- [ ] 타임라인 조회 API
- [ ] 체크리스트 완료 처리 API

### E2E 테스트 (Playwright)
- [ ] 온보딩 완료 후 타임라인 자동 생성
- [ ] 홈 화면에서 타임라인 확인
- [ ] 체크리스트 완료 처리 플로우

---

## 🚀 구현 계획

### Sprint 5 (2주)

#### Week 1: 타임라인 생성 및 조회
- **Day 1**: DB 스키마 마이그레이션
- **Day 2-3**: 타임라인 자동 생성 로직 구현 (템플릿 기반)
- **Day 4**: 홈 화면 타임라인 UI 구현
- **Day 5**: 타임라인 조회 API 및 체크리스트 완료 처리

#### Week 2: 푸시 알림
- **Day 1-2**: 푸시 알림 서비스 연동 (OneSignal 또는 FCM)
- **Day 3**: Supabase Edge Function 구현 (Cron Job)
- **Day 4**: 알림 설정 UI (ON/OFF, 시간대)
- **Day 5**: 테스트 및 버그 수정

---

## 📝 체크리스트

### 개발 완료 조건
- [ ] DB 스키마 마이그레이션 완료
- [ ] 타임라인 자동 생성 구현 (임신부, 신생아)
- [ ] 홈 화면 타임라인 UI 구현
- [ ] 체크리스트 완료 처리 기능
- [ ] 푸시 알림 연동 (OneSignal 또는 FCM)
- [ ] Supabase Edge Function (Cron Job) 구현

### 품질 검증 조건
- [ ] 타임라인 자동 생성 정확도 100%
- [ ] 푸시 알림 도달률 >90%
- [ ] 타임라인 체크 완료율 >70% (내부 테스트)

---

## 📚 참고 자료

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OneSignal (푸시 알림)](https://documentation.onesignal.com/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

**작성일**: 2026-02-07
**작성자**: BebeCare Team
