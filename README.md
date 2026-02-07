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
  - Next.js 15 프로젝트 초기화
  - Supabase Cloud 설정 및 DB 스키마 마이그레이션
  - 인증 시스템 (로그인/회원가입 UI)
  - Vercel 배포 설정
- 🔄 **Sprint 2 진행 예정**: 사용자 프로필 관리 (온보딩, 임신 정보, 자녀 정보)
- 🔄 **Sprint 3**: AI 맞춤 조언 엔진 (OpenAI GPT-4o-mini)
- 🔄 **Sprint 4**: 시기별 타임라인/체크리스트 (자동 생성 및 알림)

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: OpenAI GPT-4o-mini (프롬프트 기반)
- **Infra**: Vercel (Frontend), Supabase Cloud (Backend)
- **Testing**: Jest (Unit), Playwright (E2E)
- **Monitoring**: Sentry (Error Tracking), Vercel Analytics

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
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React 컴포넌트
│   ├── lib/                # 유틸리티 (Supabase, OpenAI)
│   └── types/              # TypeScript 타입 정의
├── public/                 # 정적 파일
└── tests/                  # 테스트 파일
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

---

## 🧪 테스트

```bash
# 단위 테스트
npm test

# E2E 테스트
npm test:e2e
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

## 📄 라이센스

Private

---

**작성일**: 2026-02-07
**버전**: 0.1.0 (MVP)
