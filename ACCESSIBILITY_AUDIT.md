# 접근성 감사 보고서

BebeCare 전체 페이지 접근성 감사 결과입니다.

**감사 일자**: 2026-02-25  
**감사 도구**: axe DevTools, Lighthouse  
**기준**: WCAG 2.1 AA

---

## 📊 전체 요약

| 페이지 | Lighthouse 점수 | 위반 개수 (P0) | 위반 개수 (P1) | 상태 |
|--------|-----------------|----------------|----------------|------|
| 랜딩 (/) | - | - | - | ⏳ 검사 대기 |
| 로그인 (/login) | - | - | - | ⏳ 검사 대기 |
| 회원가입 (/signup) | - | - | - | ⏳ 검사 대기 |
| 온보딩 (/onboarding) | - | - | - | ⏳ 검사 대기 |
| 홈 (/ - 인증 후) | - | - | - | ⏳ 검사 대기 |
| AI 챗봇 (/chat) | - | - | - | ⏳ 검사 대기 |
| 탐색 (/explore) | - | - | - | ⏳ 검사 대기 |
| 마이페이지 (/mypage) | - | - | - | ⏳ 검사 대기 |
| 육아 기록 (/log) | - | - | - | ⏳ 검사 대기 |

**목표**: 모든 페이지 Lighthouse Accessibility 90점 이상

---

## 🔍 자동 감사 방법

### 1. Lighthouse (Chrome DevTools)

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 각 페이지 접속
# DevTools > Lighthouse > Accessibility 항목 실행
```

### 2. axe DevTools (Chrome Extension)

1. [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd) 설치
2. 각 페이지에서 DevTools > axe DevTools > Scan
3. 위반 사항 확인

### 3. 자동화된 테스트 (Playwright + axe-core)

```bash
# 접근성 테스트 실행 (추가 예정)
npm run test:a11y
```

---

## 📋 페이지별 감사 결과

### 랜딩 페이지 (/)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] Hero 이미지 alt 텍스트 확인
- [ ] Feature 카드 heading 계층 확인
- [ ] CTA 버튼 컬러 대비 확인

---

### 로그인 페이지 (/login)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] Label + Input 연결 확인
- [ ] 에러 메시지 aria-describedby 확인
- [ ] Password show/hide 토글 접근성

---

### 회원가입 페이지 (/signup)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] 필수 필드 명시 확인
- [ ] 비밀번호 일치 확인 메시지
- [ ] 로딩 상태 aria-busy

---

### 온보딩 페이지 (/onboarding)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] Progress bar aria-valuenow 확인
- [ ] Step 제목 heading 계층
- [ ] 이전/다음 버튼 키보드 접근

---

### 홈 대시보드 (/ - 인증 후)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] 카드 제목 semantic heading 확인
- [ ] 퀵 로그 버튼 aria-label
- [ ] 알림 개수 badge 스크린 리더

---

### AI 챗봇 (/chat)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] 메시지 리스트 role="log" 또는 role="region"
- [ ] 입력 필드 aria-label
- [ ] 로딩 중 aria-live

---

### 탐색 (/explore)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] 탭 네비게이션 role="tab", role="tabpanel"
- [ ] 카드 링크 aria-label
- [ ] 아이콘 aria-hidden

---

### 마이페이지 (/mypage)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] Switch/Radio 라벨 연결
- [ ] 로그아웃 버튼 명확한 라벨
- [ ] 프로필 이미지 alt

---

### 육아 기록 (/log)

**Lighthouse Accessibility**: ⏳ 검사 대기

**주요 이슈 (예상):**
- [ ] 탭 네비게이션 접근성
- [ ] 날짜 선택 aria-label
- [ ] 기록 목록 semantic structure

---

## 🚨 우선순위별 이슈 (수집 중)

### P0 (Critical) - 즉시 수정 필요

_감사 완료 후 업데이트_

### P1 (High) - 빠르게 수정

_감사 완료 후 업데이트_

### P2 (Medium) - 개선 권장

_감사 완료 후 업데이트_

### P3 (Low) - 선택적 개선

_감사 완료 후 업데이트_

---

## ✅ 체크리스트

### 전체 페이지 공통

- [ ] 모든 이미지 alt 텍스트
- [ ] 모든 버튼 aria-label (아이콘만 있는 경우)
- [ ] 모든 링크 명확한 텍스트
- [ ] 키보드 네비게이션 (Tab 순서)
- [ ] 포커스 인디케이터
- [ ] 컬러 대비 4.5:1 이상

### Form 관련

- [ ] Label + Input 연결 (htmlFor)
- [ ] Required 필드 명시
- [ ] 에러 메시지 aria-describedby
- [ ] 로딩 상태 aria-busy

### 동적 컨텐츠

- [ ] Modal aria-modal, role="dialog"
- [ ] Toast aria-live
- [ ] 로딩 스피너 aria-busy

---

## 📝 다음 단계

1. **실제 페이지 접근성 감사 실행**
   - Lighthouse 각 페이지 실행
   - axe DevTools 스캔
   - 결과 수집

2. **이슈 생성**
   - P0/P1 이슈는 즉시 GitHub 이슈 생성
   - P2/P3는 백로그로 관리

3. **수정 작업**
   - P0: 즉시 수정
   - P1: 다음 스프린트
   - P2/P3: 우선순위에 따라

4. **재검사**
   - 수정 후 Lighthouse 재실행
   - 90점 이상 달성 확인

---

## 🔗 참고 문서

- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - 접근성 가이드라인
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools Documentation](https://www.deque.com/axe/devtools/)
