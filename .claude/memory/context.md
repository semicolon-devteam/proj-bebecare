# Project Context

> 세션 간 영속화되는 프로젝트 컨텍스트
> SEMO의 memory 스킬이 이 파일을 자동으로 업데이트합니다.

---

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| **이름** | bebecare |
| **SEMO 버전** | 3.14.1 |
| **설치일** | 2026-02-07 |

---

## 현재 작업 상태

### ✅ Phase 1: Discovery (완료)
- 시장 조사 완료 (기존 육아 앱 분석: 맘카페, 맘스다이어리, 베이비타임, 아이엠그라운드, 베이비센터)
- 사용자 페르소나 정의 완료 (임신부, 신생아 부모, 영유아 부모)
- 정보 아키텍처 설계 완료 (시기별/카테고리별 분류 체계)

### ✅ Phase 2: Planning (완료)
- PRD 작성 완료 (제품 비전, 핵심 기능, MVP 범위, KPI)
- Epic 생성 완료 (3개):
  - Epic 1: 사용자 프로필 관리 (온보딩, CRUD)
  - Epic 2: AI 기반 맞춤 정보 제공 엔진 (OpenAI GPT-4o-mini)
  - Epic 3: 시기별 체크리스트 및 알림 (타임라인 자동 생성)
- UX 플로우 설계 완료 (온보딩, 홈, AI 챗봇, 타임라인)

### ✅ Phase 3: Solutioning (완료)
- 기술 스택 최종 확정 완료 (Next.js 15, Supabase, OpenAI)
- DB 스키마 작성 완료 (profiles, children, conversations, timelines)
  - Generated Columns (pregnancy_week, age_months)
  - RLS 정책 설정
  - Trigger 함수 (자동 타임라인 생성)
- API 명세 작성 완료 (REST API + Supabase RPC)
  - 프로필 관리 API (GET/POST/PATCH)
  - 자녀 관리 API (CRUD)
  - AI 대화 API (POST /api/ai/chat)
  - 타임라인 API (GET/PATCH)

### 📋 다음 단계: Phase 4 Implementation
- **Sprint 1** (1주): 프로젝트 설정 및 인프라
  - Next.js 프로젝트 초기화
  - Supabase 프로젝트 생성 및 DB 마이그레이션
  - 인증 시스템 구축
  - CI/CD 파이프라인 (Vercel 자동 배포)
- **Sprint 2** (2주): 사용자 프로필 관리 (Epic 1)
- **Sprint 4** (2주): AI 기반 맞춤 조언 엔진 (Epic 2)
- **Sprint 5** (2주): 시기별 타임라인 및 알림 (Epic 3)
- **Sprint 6** (1주): 테스트 및 최적화

---

## 프로젝트 개요

**BebeCare**: 임신·출산·육아 슈퍼앱 (AI 기반 맞춤 정보 제공)

**핵심 가치**:
- 정보 통합: 파편화된 육아 정보를 한 곳에서
- AI 개인화: 프로필 기반 맞춤 조언
- 선제적 안내: 시기별 자동 타임라인 및 알림

**MVP 범위**:
- 사용자 프로필 관리
- AI 맞춤 조언 엔진 (프롬프트 기반)
- 시기별 타임라인/체크리스트

---

## 기술 스택 (확정)

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: OpenAI GPT-4o-mini (프롬프트 기반, 비용 최적화)
- **Infra**: Vercel (Frontend), Supabase Cloud (Backend)
- **Testing**: Jest (Unit), Playwright (E2E)
- **Monitoring**: Sentry (Error Tracking), Vercel Analytics

---

## 주요 문서 위치

### Discovery 단계
- `.docs/discovery/market-research.md`: 시장 조사 및 경쟁사 분석
- `.docs/discovery/personas.md`: 사용자 페르소나 정의
- `.docs/discovery/information-architecture.md`: 정보 분류 체계

### Planning 단계
- `.docs/planning/PRD.md`: 제품 요구사항 문서
- `.docs/planning/epics/epic-1-user-profile.md`: 사용자 프로필 관리
- `.docs/planning/epics/epic-2-ai-engine.md`: AI 조언 엔진
- `.docs/planning/epics/epic-3-timeline.md`: 타임라인 및 알림
- `.docs/planning/ux-flows.md`: UX 플로우 다이어그램

### Solutioning 단계
- `.docs/architecture/tech-stack.md`: 기술 스택 및 선정 근거
- `.docs/architecture/database-schema.sql`: DB 스키마 및 마이그레이션
- `.docs/architecture/api-spec.md`: REST API + RPC 함수 명세

---

*마지막 업데이트: 2026-02-07*
