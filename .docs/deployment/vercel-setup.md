# Vercel 배포 가이드

## 1. Vercel 프로젝트 생성

### CLI를 통한 배포 (권장)

```bash
# Vercel CLI 전역 설치
npm i -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

### GitHub 연동 배포

1. GitHub에 레포지토리 생성 및 푸시
2. [Vercel Dashboard](https://vercel.com/dashboard) 접속
3. "New Project" 클릭
4. GitHub 레포지토리 연결
5. 프로젝트 설정 확인 후 Deploy

## 2. 환경 변수 설정

Vercel Dashboard에서 다음 환경 변수를 설정해야 합니다:

### 필수 환경 변수

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://mvvnmzypxvjqpuvqrxlo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API (AI 상담 기능)
OPENAI_API_KEY=your_openai_api_key
```

### Vercel Dashboard에서 환경 변수 설정하기

1. Vercel 프로젝트 페이지에서 "Settings" 탭 클릭
2. 왼쪽 메뉴에서 "Environment Variables" 선택
3. 각 환경 변수를 추가:
   - Name: 변수명 (예: `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: 값 (`.env.local` 파일에서 복사)
   - Environment: Production, Preview, Development 모두 체크
4. "Save" 클릭

## 3. 배포 확인

### 자동 배포 (GitHub 연동)

- `main` 브랜치에 푸시하면 자동으로 프로덕션 배포
- 다른 브랜치에 푸시하면 자동으로 프리뷰 배포

### 수동 배포 (CLI)

```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 4. 도메인 설정

### Vercel 제공 도메인

- 자동 할당: `bebecare.vercel.app`

### 커스텀 도메인 연결

1. Vercel Dashboard → Settings → Domains
2. 도메인 입력 (예: `bebecare.com`)
3. DNS 설정 안내에 따라 도메인 레지스트라에서 설정
4. 검증 완료 후 자동 SSL 인증서 발급

## 5. CI/CD 파이프라인

### GitHub Actions (선택사항)

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
```

### Vercel 자동 배포 설정

- **Production**: `main` 브랜치에 푸시 시 자동 배포
- **Preview**: PR 생성 시 자동으로 프리뷰 배포 생성
- **Deployment Protection**: Settings → Git → 배포 조건 설정 가능

## 6. 배포 후 확인 사항

### ✅ 체크리스트

- [ ] 환경 변수가 올바르게 설정되었는지 확인
- [ ] Supabase 연결 테스트 (회원가입/로그인)
- [ ] AI 상담 기능 테스트 (OpenAI API)
- [ ] 타임라인 자동 생성 확인
- [ ] 모든 페이지 접근 가능 확인
- [ ] 모바일 반응형 확인
- [ ] Lighthouse 점수 확인 (>90점)

### 성능 최적화

```bash
# Lighthouse CLI로 성능 측정
npx lighthouse https://bebecare.vercel.app --view
```

## 7. 모니터링 설정

### Vercel Analytics (무료)

1. Dashboard → Analytics 탭
2. Enable Analytics 클릭
3. 트래픽, 성능 지표 자동 수집

### Sentry 연동 (선택사항)

```bash
npm install @sentry/nextjs

# Sentry 초기화
npx @sentry/wizard@latest -i nextjs
```

`.env.local`에 추가:

```env
SENTRY_DSN=your_sentry_dsn_here
```

## 8. 롤백 및 버전 관리

### 이전 버전으로 롤백

1. Vercel Dashboard → Deployments
2. 롤백할 배포 선택
3. "Promote to Production" 클릭

### 버전 관리

- Git 태그를 사용한 버전 관리 권장
- `git tag v1.0.0 && git push --tags`

## 9. 문제 해결

### 빌드 실패 시

```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build

# TypeScript 타입 체크
npx tsc --noEmit

# ESLint 검사
npm run lint
```

### 환경 변수 문제

- `NEXT_PUBLIC_*` 접두사는 클라이언트에서 접근 가능
- 민감한 정보는 서버 사이드 환경 변수 사용 (접두사 없음)

### Supabase 연결 문제

- Supabase Dashboard → Settings → API에서 키 확인
- RLS 정책이 올바르게 설정되었는지 확인

## 참고 자료

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase with Vercel](https://supabase.com/docs/guides/hosting/vercel)
