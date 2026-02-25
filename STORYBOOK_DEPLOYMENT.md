# Storybook 배포 가이드

BebeCare 디자인 시스템 Storybook을 Chromatic으로 배포하는 가이드입니다.

---

## 🚀 Chromatic 배포

### 1. Chromatic 프로젝트 생성

1. [Chromatic](https://www.chromatic.com/) 접속
2. GitHub 계정으로 로그인
3. "Add project" 클릭
4. `semicolon-devteam/proj-bebecare` 선택
5. Project Token 복사

### 2. GitHub Secrets 설정

1. GitHub 레포지토리 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `CHROMATIC_PROJECT_TOKEN`
4. Value: Chromatic에서 복사한 토큰
5. "Add secret" 클릭

### 3. 자동 배포 확인

`.github/workflows/chromatic.yml` 파일이 설정되어 있습니다.

**배포 트리거:**
- `main` 브랜치에 Push
- Pull Request 생성

**배포 과정:**
1. GitHub Actions가 자동으로 실행
2. Storybook 빌드 (`npm run build-storybook`)
3. Chromatic에 배포
4. PR에 배포 URL 코멘트 추가

### 4. 배포 URL 확인

배포 완료 후:
- Chromatic 대시보드에서 확인
- PR 코멘트에 배포 URL 추가됨
- `https://[project-id].chromatic.com` 형식

---

## 🧪 로컬 Storybook 실행

### 개발 서버 실행

```bash
npm run storybook
```

브라우저에서 [http://localhost:6006](http://localhost:6006) 접속

### 프로덕션 빌드

```bash
npm run build-storybook
```

빌드 결과: `storybook-static/` 폴더

### 빌드 결과 로컬 확인

```bash
npx http-server storybook-static
```

---

## 📚 Storybook 구조

```
src/stories/
  ├── ui/                      # UI 컴포넌트 Stories
  │   ├── Button.stories.tsx
  │   ├── Input.stories.tsx
  │   ├── Card.stories.tsx
  │   ├── Badge.stories.tsx
  │   ├── Avatar.stories.tsx
  │   ├── Modal.stories.tsx
  │   ├── Select.stories.tsx
  │   ├── Checkbox.stories.tsx
  │   ├── Radio.stories.tsx
  │   ├── Switch.stories.tsx
  │   ├── Textarea.stories.tsx
  │   ├── Label.stories.tsx
  │   ├── Progress.stories.tsx
  │   ├── Skeleton.stories.tsx
  │   └── Tabs.stories.tsx
  └── [domain]/                # 도메인 컴포넌트 Stories (추가 예정)
```

**총 Stories:** 13개 컴포넌트, 80+ variants

---

## 🎨 Storybook 설정

### `.storybook/preview.ts`

```typescript
import '../src/app/globals.css';

export default {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFF9F5' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'dark', value: '#1F2937' },
      ],
    },
  },
};
```

### `.storybook/main.ts`

- Framework: Next.js + Vite
- Addons: a11y, docs, vitest, onboarding

---

## 🔍 접근성 검사 (Storybook Addon)

Storybook에서 자동으로 접근성 검사:

1. Storybook 실행
2. "Accessibility" 탭 클릭
3. WCAG 위반 사항 확인

**지원:**
- WCAG 2.1 AA 기준
- axe-core 기반
- 실시간 검사

---

## 🛠️ 문제 해결

### Storybook 빌드 실패

**증상:** `npm run build-storybook` 실패

**해결:**
1. `.env.local` 파일 확인 (Supabase 환경 변수 필요 없음)
2. `node_modules` 삭제 후 재설치:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Chromatic 배포 실패

**증상:** GitHub Actions에서 Chromatic 배포 실패

**해결:**
1. GitHub Secrets에 `CHROMATIC_PROJECT_TOKEN` 설정 확인
2. Chromatic 프로젝트 토큰 재발급 후 업데이트

---

## 📝 추가 작업

### 추가 Stories 작성

```bash
# 새 Story 파일 생성
touch src/stories/ui/[ComponentName].stories.tsx
```

### 도메인 컴포넌트 Stories

```bash
mkdir -p src/stories/domain
touch src/stories/domain/BabyProfileCard.stories.tsx
```

---

## 📄 참고 문서

- [Storybook Documentation](https://storybook.js.org/docs)
- [Chromatic Documentation](https://www.chromatic.com/docs)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
