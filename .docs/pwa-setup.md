# PWA (Progressive Web App) 설정 가이드

## 🎯 PWA 설정 완료

BebeCare는 PWA로 구현되어 모바일 앱처럼 설치하고 사용할 수 있습니다.

### ✅ 완료된 설정

1. **next-pwa 설치 및 설정**
   - Service Worker 자동 생성
   - 오프라인 지원
   - 캐시 관리

2. **manifest.json 생성**
   - 앱 이름, 아이콘, 테마 색상 설정
   - 단축 아이콘 (AI 상담, 타임라인)
   - 스플래시 스크린 설정

3. **메타데이터 설정**
   - Apple Touch Icon 지원
   - 테마 색상 설정
   - Viewport 최적화

## 📱 PWA 특징

### 설치 가능
- 홈 화면에 추가 가능
- 앱처럼 독립 실행
- 전체 화면 모드

### 오프라인 지원
- Service Worker를 통한 캐싱
- 네트워크 없이도 기본 기능 사용 가능

### 성능 최적화
- 빠른 로딩 속도
- 캐시 우선 전략
- 프리캐싱 지원

## 🖼️ 아이콘 생성 (TODO)

PWA가 정상적으로 작동하려면 아이콘 이미지가 필요합니다.

### 필요한 아이콘

`public/` 폴더에 다음 이미지를 추가해야 합니다:

```
public/
├── icon-192x192.png    (필수)
├── icon-512x512.png    (필수)
├── icon-ai.png         (선택, AI 상담 바로가기)
├── icon-timeline.png   (선택, 타임라인 바로가기)
└── screenshot-mobile.png (선택, 앱 스토어 스크린샷)
```

### 아이콘 생성 방법

#### 옵션 1: 온라인 도구 사용

1. [Favicon Generator](https://realfavicongenerator.net/) 방문
2. 로고 이미지 업로드 (최소 512x512px)
3. PWA 아이콘 생성
4. 생성된 파일을 `public/` 폴더에 추가

#### 옵션 2: 디자인 도구 사용

- **Figma/Sketch**: 512x512px 캔버스에 로고 디자인
- **Export**: PNG 형식으로 192x192, 512x512 크기 내보내기
- 배경색: #3b82f6 (또는 브랜드 색상)
- 로고: 중앙 정렬, 여백 20%

#### 임시 솔루션 (개발용)

```bash
# ImageMagick을 사용한 placeholder 생성 (Mac)
brew install imagemagick

# 파란색 배경에 흰색 텍스트 아이콘 생성
convert -size 192x192 xc:#3b82f6 -gravity center \
  -pointsize 80 -fill white -annotate +0+0 'BC' \
  public/icon-192x192.png

convert -size 512x512 xc:#3b82f6 -gravity center \
  -pointsize 200 -fill white -annotate +0+0 'BC' \
  public/icon-512x512.png
```

## 🧪 PWA 테스트

### 1. 로컬 테스트

```bash
# 프로덕션 빌드
npm run build
npm start

# localhost:3000 접속 후
# Chrome DevTools → Application → Manifest 확인
```

### 2. Lighthouse 검사

```bash
# Lighthouse CLI 사용
npx lighthouse http://localhost:3000 --view \
  --only-categories=pwa
```

**목표 점수**: PWA 90점 이상

### 3. 모바일 테스트

#### Chrome (Android)
1. Chrome에서 사이트 접속
2. 메뉴 → "홈 화면에 추가"
3. 앱처럼 실행되는지 확인

#### Safari (iOS)
1. Safari에서 사이트 접속
2. 공유 버튼 → "홈 화면에 추가"
3. 전체 화면 모드 확인

## 🚀 배포 후 확인 사항

### ✅ PWA 체크리스트

- [ ] manifest.json이 올바르게 로드됨
- [ ] 모든 아이콘 이미지가 존재함
- [ ] Service Worker가 등록됨
- [ ] HTTPS로 배포됨 (PWA 필수)
- [ ] "홈 화면에 추가" 프롬프트가 표시됨
- [ ] 오프라인에서 기본 페이지 접근 가능
- [ ] Lighthouse PWA 점수 90점 이상

### 디버깅

Chrome DevTools → Application 탭에서 확인:

1. **Manifest**
   - 모든 필드가 올바른지 확인
   - 아이콘이 제대로 로드되는지 확인

2. **Service Workers**
   - Service Worker가 활성화되어 있는지 확인
   - Cache Storage에 파일이 캐시되었는지 확인

3. **Console**
   - PWA 관련 에러나 경고 확인

## 📱 React Native 전환 준비

### 현재 아키텍처

```
PWA (Next.js)
└── 추후 React Native로 전환 예정
```

### 전환 시 고려사항

1. **공통 로직 분리**
   - API 호출 로직을 별도 패키지로 분리
   - 비즈니스 로직을 플랫폼 독립적으로 작성

2. **UI 컴포넌트**
   - React Native로 재작성 필요
   - Tailwind → React Native StyleSheet 전환

3. **네비게이션**
   - Next.js Router → React Navigation

4. **상태 관리**
   - 현재 구조 유지 가능 (Context API, Zustand 등)

5. **인증**
   - Supabase Auth는 React Native 지원
   - 코드 재사용 가능

## 🔧 PWA 설정 파일

### next.config.ts

```typescript
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

### manifest.json

```json
{
  "name": "BebeCare - 임신·출산·육아 슈퍼앱",
  "short_name": "BebeCare",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}
```

### layout.tsx

```typescript
export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'BebeCare',
  },
  themeColor: '#3b82f6',
};
```

## 📚 참고 자료

- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
