# BebeCare

> 임신·출산·육아 슈퍼앱 - AI 기반 맞춤 정보 제공

## 📋 프로젝트 개요

**BebeCare**는 임신부터 육아까지 모든 단계에서 필요한 정보를 통합 제공하는 AI 기반 슈퍼앱입니다.

### 핵심 가치

- **정보 통합**: 파편화된 육아 정보를 한 곳에서
- **AI 개인화**: 프로필 기반 맞춤 조언 (임신 주차, 아이 개월, 직장, 지역)
- **선제적 안내**: 시기별 자동 타임라인 및 알림

### MVP 범위

- ✅ **Sprint 1 완료**: 프로젝트 설정 및 인프라
- ✅ **Sprint 2 완료**: 디자인 시스템 전면 개편
  - UI 컴포넌트 라이브러리 17개
  - Storybook 세팅 및 Stories (13개 컴포넌트, 80+ variants)
  - 디자인 가이드라인 문서 (DESIGN_SYSTEM.md, DESIGN_PATTERNS.md, ACCESSIBILITY.md)
- 🔄 **Sprint 3 진행 중**: 사용자 프로필 관리 (온보딩, 임신 정보, 자녀 정보)
- 🔄 **Sprint 4**: AI 맞춤 조언 엔진 (OpenAI GPT-4o-mini)
- 🔄 **Sprint 5**: 시기별 타임라인/체크리스트 (자동 생성 및 알림)

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **UI Components**: Custom Design System (17 components) + Storybook
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: OpenAI GPT-4o-mini (프롬프트 기반)
- **Infra**: Vercel (Frontend), Supabase Cloud (Backend)
- **Testing**: Jest (Unit), Playwright (E2E)
- **Monitoring**: Sentry (Error Tracking), Vercel Analytics

---

## 🎨 디자인 시스템

BebeCare는 일관된 사용자 경험을 위해 자체 디자인 시스템을 구축했습니다.

### 주요 문서

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**: 디자인 토큰 (컬러, 타이포그래피, 스페이싱, Shadow)
- **[DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)**: UI 패턴 라이브러리 (Form, List, Empty State, Loading 등)
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)**: WCAG 2.1 AA 접근성 가이드라인

### UI 컴포넌트 라이브러리

**총 17개 컴포넌트:**

```
Form Components (8개):
  - Button, Input, Select, Textarea, Label, Checkbox, Radio, Switch

Layout Components (7개):
  - Card, Badge, Avatar, Modal, Toast, ErrorMessage, Tabs

Feedback Components (2개):
  - Progress, Skeleton
```

**사용 예시:**
```tsx
import { Button, Input, Label, Card } from '@/components/ui';

<Card shadow="lg" padding="md">
  <Label htmlFor="email" required>이메일</Label>
  <Input id="email" type="email" placeholder="your@email.com" />
  <Button variant="primary" fullWidth>로그인</Button>
</Card>
```

### Storybook

컴포넌트 문서화 및 개발 환경:

```bash
# Storybook 실행
npm run storybook

# Storybook 빌드
npm run build-storybook
```

브라우저에서 [http://localhost:6006](http://localhost:6006) 접속

**Storybook Stories**: 13개 컴포넌트, 80+ variants

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- npm 9.x 이상

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어 Supabase, OpenAI API 키 입력

# 개발 서버 실행
npm dev

# Storybook 실행 (선택)
npm run storybook
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 📁 프로젝트 구조

```
bebecare/
├── .docs/                  # 프로젝트 문서
│   ├── discovery/          # Phase 1: 시장 조사, 페르소나
│   ├── planning/           # Phase 2: PRD, Epic, UX 플로우
│   └── architecture/       # Phase 3: 기술 스택, DB 스키마, API 명세
├── .storybook/             # Storybook 설정
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/
│   │   ├── ui/             # 디자인 시스템 컴포넌트
│   │   └── [domain]/       # 도메인 컴포넌트
│   ├── lib/                # 유틸리티 (Supabase, OpenAI)
│   ├── stories/            # Storybook Stories
│   └── types/              # TypeScript 타입 정의
├── public/                 # 정적 파일
├── tests/                  # 테스트 파일
├── DESIGN_SYSTEM.md        # 디자인 토큰 문서
├── DESIGN_PATTERNS.md      # UI 패턴 가이드
└── ACCESSIBILITY.md        # 접근성 가이드라인
```

---

## 📚 문서

### Discovery 단계
- [시장 조사](.docs/discovery/market-research.md): 경쟁사 분석
- [사용자 페르소나](.docs/discovery/personas.md): 임신부, 신생아/영유아 부모
- [정보 아키텍처](.docs/discovery/information-architecture.md): 정보 분류 체계

### Planning 단계
- [PRD](.docs/planning/PRD.md): 제품 요구사항 문서
- [Epic 1](.docs/planning/epics/epic-1-user-profile.md): 사용자 프로필 관리
- [Epic 2](.docs/planning/epics/epic-2-ai-engine.md): AI 조언 엔진
- [Epic 3](.docs/planning/epics/epic-3-timeline.md): 타임라인 및 알림
- [UX 플로우](.docs/planning/ux-flows.md): 사용자 여정

### Solutioning 단계
- [기술 스택](.docs/architecture/tech-stack.md): 기술 선정 근거
- [DB 스키마](.docs/architecture/database-schema.sql): Supabase 마이그레이션
- [API 명세](.docs/architecture/api-spec.md): REST API + RPC 함수

### Design System
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md): 디자인 토큰 (컬러, 타이포그래피, 스페이싱, Shadow, 애니메이션)
- [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md): UI 패턴 라이브러리 (Form, List, Empty State, Loading, Modal, Feedback, Responsive)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md): WCAG 2.1 AA 체크리스트, 검증 도구, 컴포넌트별 가이드라인
- [src/components/ui/README.md](./src/components/ui/README.md): 컴포넌트 사용법

---

## 🧪 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm test:e2e

# 접근성 테스트 (axe DevTools)
npm run test:a11y
```

---

## 🚢 배포

### Vercel 자동 배포

GitHub에 Push하면 Vercel이 자동으로 배포합니다.

```bash
# 프로덕션 빌드 테스트
npm build
npm start
```

---

## 📝 개발 워크플로우

1. **Sprint Planning**: Epic → Tasks 분해
2. **구현**: Feature Branch 생성
3. **Quality Gate**: Lint + TypeScript + Build 검증
4. **Pull Request**: 코드 리뷰 및 E2E 테스트
5. **배포**: Vercel 자동 배포

---

## 🎯 브랜드 컬러

- **Primary (Dusty Rose)**: `#C2728A` - 브랜드 주색상, 따뜻하고 친근한 느낌
- **Secondary (Sage Green)**: `#7C9A82` - 보조색상, 안정감과 자연스러움
- **Surface Warm**: `#FFF9F5` - 기본 배경색

---

## 📄 라이센스

Private

---

**작성일**: 2026-02-07  
**최종 업데이트**: 2026-02-24 (Design System 개편 완료)  
**버전**: 0.2.0 (MVP + Design System)
