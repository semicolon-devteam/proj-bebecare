# 최종 디자인 리뷰 체크리스트

BebeCare 전체 페이지 디자인 일관성 및 품질 확인 체크리스트입니다.

**리뷰 일자**: 2026-02-25  
**리뷰어**: DesignClaw  
**기준**: DESIGN_SYSTEM.md, DESIGN_PATTERNS.md

---

## 📋 전체 페이지 목록

### 인증 관련
- [ ] 랜딩 페이지 (/)
- [ ] 로그인 (/login)
- [ ] 회원가입 (/signup)
- [ ] 온보딩 (/onboarding)

### 메인 기능
- [ ] 홈 대시보드 (/ - 인증 후)
- [ ] AI 챗봇 (/chat)
- [ ] 탐색 (/explore)
- [ ] 육아 기록 (/log)
- [ ] 임신 주차 (/pregnancy-weeks)
- [ ] 예방접종 (/vaccination)
- [ ] 혜택 정보 (/benefits)

### 설정 및 기타
- [ ] 마이페이지 (/mypage)
- [ ] 알림 (/notifications)
- [ ] 더보기 (/more)
- [ ] 관리자 알림 (/admin/notifications)

---

## 🎨 디자인 토큰 준수

### 컬러 시스템

- [ ] **Primary (Dusty Rose)** 일관되게 사용
  - [ ] CTA 버튼: `bg-dusty-rose-500`
  - [ ] 링크 텍스트: `text-dusty-rose-500`
  - [ ] 포커스 링: `ring-dusty-rose-500`
  
- [ ] **Secondary (Sage)** 보조색상 적절히 사용
  - [ ] 보조 버튼: `bg-sage-400`
  - [ ] Badge: `bg-sage-50 text-sage-700`

- [ ] **하드코딩된 색상 제거**
  - [ ] `#C2728A` → `text-dusty-rose-500` 또는 Tailwind class
  - [ ] `#7C9A82` → `text-sage-400` 또는 Tailwind class

### 타이포그래피

- [ ] **Heading 계층** 준수
  - [ ] H1: `text-h1` (2.25rem, 700)
  - [ ] H2: `text-h2` (1.875rem, 700)
  - [ ] H3: `text-h3` (1.5rem, 600)
  - [ ] H4: `text-h4` (1.25rem, 600)

- [ ] **Body 텍스트** 일관성
  - [ ] 기본: `text-body` (1rem)
  - [ ] 작은 텍스트: `text-body-sm` (0.875rem)
  - [ ] 캡션: `text-caption` (0.75rem)

### 스페이싱

- [ ] **4px Grid 준수**
  - [ ] 간격: `space-y-4`, `gap-3` 등 (4의 배수)
  - [ ] 패딩: `p-4`, `px-6` 등

- [ ] **일관된 Card 패딩**
  - [ ] 기본: `p-6` (24px)
  - [ ] 작은 카드: `p-4` (16px)
  - [ ] 큰 카드: `p-8` (32px)

### Shadow

- [ ] **Warm Shadow 사용**
  - [ ] Card: `shadow-warm` 또는 `shadow-warm-md`
  - [ ] Modal: `shadow-warm-lg` 또는 `shadow-warm-xl`

---

## 🧩 컴포넌트 사용 일관성

### Button

- [ ] **새 Button 컴포넌트 사용** (`@/components/ui`)
  - [ ] variant 일관성 (primary, secondary, outline, ghost)
  - [ ] size 일관성 (sm, md, lg, xl)
  - [ ] loading 상태 처리
  - [ ] disabled 상태 스타일

- [ ] **아이콘 버튼** aria-label 명시

### Input

- [ ] **새 Input 컴포넌트 사용**
  - [ ] Label 연결 (htmlFor)
  - [ ] 에러 상태 (`error` prop)
  - [ ] 아이콘 (icon, iconAfter) 일관성

### Card

- [ ] **새 Card 컴포넌트 사용**
  - [ ] shadow, hover, padding variants 일관성
  - [ ] CardHeader, CardTitle 사용

### Badge

- [ ] **새 Badge 컴포넌트 사용**
  - [ ] variant 일관성 (default, success, warning, error)
  - [ ] 아이콘 + 텍스트 조합

### Progress

- [ ] **Progress 컴포넌트 사용**
  - [ ] 온보딩: Progress bar
  - [ ] 로딩: Skeleton 또는 Spinner

---

## 📱 반응형 디자인

### Breakpoints

- [ ] **모바일 우선** (default)
- [ ] **태블릿** (`md:` 768px)
- [ ] **데스크탑** (`lg:` 1024px)

### Layout

- [ ] **모바일**: 단일 컬럼, 패딩 `px-4`
- [ ] **태블릿**: 2컬럼 grid 또는 여백 증가
- [ ] **데스크탑**: 최대 너비 `max-w-4xl` 또는 `max-w-6xl`

### Navigation

- [ ] **모바일**: 하단 탭 바
- [ ] **데스크탑**: 사이드바 또는 상단 네비게이션

---

## ♿ 접근성

### Semantic HTML

- [ ] **버튼**: `<button>` 사용 (div 금지)
- [ ] **링크**: `<a>` 사용
- [ ] **Heading**: 계층적 사용 (`<h1>` → `<h2>` → `<h3>`)

### ARIA

- [ ] **아이콘 버튼**: `aria-label` 명시
- [ ] **Modal**: `aria-modal="true"`, `role="dialog"`
- [ ] **Toast/Alert**: `role="alert"`
- [ ] **에러 메시지**: `role="alert"` 또는 `aria-describedby`

### Keyboard Navigation

- [ ] **Tab 순서** 논리적
- [ ] **포커스 인디케이터** 명확 (2px outline, 2px offset)
- [ ] **Modal Escape** 키로 닫기

### Color Contrast

- [ ] **텍스트**: 최소 4.5:1
- [ ] **큰 텍스트** (18px+): 최소 3:1
- [ ] **UI 컴포넌트**: 최소 3:1

---

## 🎯 UX 패턴

### Loading States

- [ ] **Skeleton** 사용 (Card, List 등)
- [ ] **Spinner** 명확한 위치
- [ ] **Loading 텍스트** "로딩 중..." 명시

### Empty States

- [ ] **아이콘 + 설명 + CTA**
- [ ] "아직 기록이 없어요" 같은 친근한 문구

### Error States

- [ ] **에러 메시지** 구체적
- [ ] **재시도 버튼** 제공
- [ ] **빨간색 + 아이콘** 조합

### Form Validation

- [ ] **Inline validation** (즉각 피드백)
- [ ] **에러 메시지** 필드 아래 표시
- [ ] **Submit 버튼** 로딩 상태

---

## 📝 페이지별 체크리스트

### 랜딩 페이지 (/)

- [ ] Hero section 디자인 일관성
- [ ] CTA 버튼 크기/색상 명확
- [ ] Feature 카드 shadow/hover 일관성
- [ ] Footer 타이포그래피

### 로그인/회원가입

- [ ] Card 컴포넌트 사용
- [ ] Input + Label 연결
- [ ] Button variant 일관성
- [ ] 에러 메시지 스타일

### 온보딩

- [ ] Progress bar 스타일 일관성
- [ ] Step 카드 디자인
- [ ] 이전/다음 버튼 일관성
- [ ] 로딩 상태

### 홈 대시보드

- [ ] BabyProfileCard 디자인
- [ ] TodaySummary 카드 간격
- [ ] 퀵 로그 버튼 스타일
- [ ] Header 네비게이션

### AI 챗봇

- [ ] 메시지 버블 디자인
- [ ] 입력 필드 스타일
- [ ] 전송 버튼 일관성
- [ ] 로딩 애니메이션

### 마이페이지

- [ ] 프로필 섹션 디자인
- [ ] 설정 항목 간격
- [ ] Switch/Radio 사용
- [ ] 로그아웃 버튼 스타일

---

## ✅ 최종 승인 기준

### P0 (필수)

- [ ] 모든 페이지 디자인 토큰 준수
- [ ] 새 UI 컴포넌트 일관되게 사용
- [ ] 접근성 기본 체크리스트 통과
- [ ] 반응형 레이아웃 정상 작동

### P1 (중요)

- [ ] Lighthouse Accessibility 90점 이상
- [ ] 모든 인터랙션 키보드 접근 가능
- [ ] 컬러 대비 WCAG AA 준수

### P2 (권장)

- [ ] 애니메이션 자연스러움
- [ ] 로딩 상태 일관성
- [ ] Empty/Error state 친근함

---

## 🔗 참고 문서

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [STORYBOOK_DEPLOYMENT.md](./STORYBOOK_DEPLOYMENT.md)

---

**다음 단계**: 체크리스트 완료 후 GitHub 이슈로 수정 사항 정리
