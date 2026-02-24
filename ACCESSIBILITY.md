# Accessibility Checklist - BebeCare

WCAG 2.1 AA 기준 접근성 가이드라인 및 체크리스트입니다.

---

## ✅ 필수 체크리스트

### 1. Semantic HTML

- [ ] 모든 버튼은 `<button>` 사용 (div 금지)
- [ ] 링크는 `<a>` 사용
- [ ] 제목은 `<h1>` ~ `<h6>` 계층적 사용
- [ ] 폼은 `<form>`, `<label>`, `<input>` 사용
- [ ] 리스트는 `<ul>`, `<ol>`, `<li>` 사용

### 2. ARIA Attributes

- [ ] 아이콘 버튼에 `aria-label` 추가
- [ ] 모달에 `role="dialog"`, `aria-modal="true"` 추가
- [ ] 탭에 `role="tab"`, `role="tabpanel"` 추가
- [ ] 에러 메시지에 `role="alert"` 추가
- [ ] 장식용 아이콘에 `aria-hidden="true"` 추가

### 3. Keyboard Navigation

- [ ] 모든 인터랙티브 요소 Tab으로 접근 가능
- [ ] 모달 Escape 키로 닫기
- [ ] Dropdown Enter/Space로 열기
- [ ] Tab 순서 논리적 (위→아래, 왼쪽→오른쪽)
- [ ] 포커스 트랩 (모달 열릴 때 포커스 모달 내부로)

### 4. Focus Management

- [ ] 모든 포커스 가능한 요소에 focus-visible 스타일
- [ ] 포커스 인디케이터 명확 (2px 아웃라인, 2px offset)
- [ ] 마우스 클릭 시 포커스 링 제거 (`:focus:not(:focus-visible)`)
- [ ] Skip to main content 링크 제공

### 5. Color Contrast

- [ ] 일반 텍스트 (16px 미만): 최소 4.5:1
- [ ] 큰 텍스트 (18px 이상): 최소 3:1
- [ ] UI 컴포넌트: 최소 3:1
- [ ] 컬러만으로 정보 전달 금지 (아이콘/텍스트 병행)

### 6. Images & Icons

- [ ] 모든 이미지에 `alt` 속성
- [ ] 장식용 이미지 `alt=""` (empty string)
- [ ] 아이콘 + 텍스트 조합 권장
- [ ] 아이콘만 사용 시 `aria-label` 필수

### 7. Forms

- [ ] 모든 입력 필드에 `<label>` 연결 (`htmlFor`)
- [ ] Required 필드 명시 (`*` or `required` 속성)
- [ ] 에러 메시지 `aria-describedby`로 연결
- [ ] Autocomplete 속성 사용 (email, password 등)
- [ ] 폼 제출 시 로딩 상태 명시

### 8. Touch Targets

- [ ] 모바일 최소 44x44px
- [ ] 버튼 간 최소 8px 간격
- [ ] 작은 아이콘도 충분한 패딩

### 9. Screen Reader

- [ ] 중요한 정보는 시각적으로만 표현하지 않기
- [ ] 로딩 상태 명시 (`aria-busy`, `aria-live`)
- [ ] 동적 컨텐츠 업데이트 `aria-live` 사용
- [ ] 숨겨진 컨텐츠 `aria-hidden="true"` 또는 `display: none`

### 10. Responsive & Zoom

- [ ] 200% 확대 시 레이아웃 깨지지 않음
- [ ] 모바일 가로 모드 지원
- [ ] 최소 폰트 크기 14px (읽기 어려운 12px 금지)

---

## 🔍 검증 도구

### 자동 검사

1. **axe DevTools** (Chrome Extension)
   - 설치: [Chrome Web Store](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
   - 사용: DevTools > axe DevTools > Scan

2. **Lighthouse** (Chrome DevTools)
   - DevTools > Lighthouse > Accessibility 항목
   - 목표: 90점 이상

3. **WAVE** (웹 접근성 평가 도구)
   - 설치: [WAVE Extension](https://wave.webaim.org/extension/)

### 수동 검사

1. **키보드 네비게이션**
   - Tab 키로 모든 페이지 탐색
   - Enter/Space로 버튼/링크 클릭
   - Escape로 모달 닫기

2. **스크린 리더**
   - **macOS**: VoiceOver (Cmd + F5)
   - **Windows**: NVDA (무료)
   - 모든 텍스트/버튼 읽히는지 확인

3. **컬러 대비**
   - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - Chrome DevTools > Elements > Color Picker

4. **확대/축소**
   - 브라우저 200% 확대 (Cmd/Ctrl + +)
   - 레이아웃 깨지지 않는지 확인

---

## 🎯 Priority Levels

### P0 (Critical) - 반드시 수정
- 키보드로 접근 불가능한 요소
- 컬러 대비 3:1 미만
- 스크린 리더로 읽을 수 없는 중요 정보
- 폼 제출 불가

### P1 (High) - 빠르게 수정
- aria-label 누락
- 포커스 인디케이터 없음
- 모바일 터치 타겟 44px 미만

### P2 (Medium) - 개선 권장
- 시맨틱 HTML 미사용
- 에러 메시지 불명확
- 텍스트 크기 12px

### P3 (Low) - 선택적 개선
- 애니메이션 속도
- Skip to content 링크
- Breadcrumb 네비게이션

---

## 📋 Page-Specific Checklist

### Landing Page
- [ ] Hero 이미지 alt 텍스트
- [ ] CTA 버튼 명확한 라벨
- [ ] Feature 카드 heading 계층
- [ ] Skip to main content

### Login/Signup
- [ ] Label + Input 연결
- [ ] 에러 메시지 aria-describedby
- [ ] Password show/hide 토글 접근성
- [ ] 로딩 상태 명시

### 온보딩
- [ ] Progress bar aria-valuenow
- [ ] Step 제목 명확
- [ ] 이전/다음 버튼 키보드 접근
- [ ] 필수 필드 명시

### 홈 대시보드
- [ ] 카드 제목 semantic heading
- [ ] 퀵 로그 버튼 aria-label
- [ ] 알림 개수 badge 읽기
- [ ] Bottom nav 현재 페이지 표시

---

## 🛠️ Component-Specific Guidelines

### Button
```tsx
// ✅ Good
<Button aria-label="Close" onClick={onClose}>
  <X className="h-4 w-4" aria-hidden="true" />
</Button>

// ❌ Bad
<div onClick={onClose}>
  <X />
</div>
```

### Input
```tsx
// ✅ Good
<Label htmlFor="email" required>이메일</Label>
<Input
  id="email"
  type="email"
  autoComplete="email"
  aria-describedby={error ? 'email-error' : undefined}
  aria-invalid={!!error}
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

### Modal
```tsx
// ✅ Good
<Modal
  open={open}
  onClose={onClose}
  title="제목"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">제목</h2>
  ...
</Modal>
```

### Tabs
```tsx
// ✅ Good
<Tabs defaultValue="tab1">
  <TabsList role="tablist">
    <TabsTrigger value="tab1" role="tab" aria-selected={active === 'tab1'}>
      Tab 1
    </TabsTrigger>
  </TabsList>
  <TabsContent value="tab1" role="tabpanel">
    Content
  </TabsContent>
</Tabs>
```

---

## 📝 Testing Script

### 키보드 네비게이션 테스트

1. Tab 키만으로 모든 페이지 탐색
2. Shift + Tab으로 역순 탐색
3. Enter/Space로 버튼/링크 활성화
4. Escape로 모달/드롭다운 닫기
5. 화살표 키로 라디오/탭 이동

### 스크린 리더 테스트

1. VoiceOver/NVDA 켜기
2. 페이지 처음부터 끝까지 읽기
3. 모든 버튼/링크 라벨 확인
4. 폼 입력 시 에러 메시지 읽히는지
5. 이미지 alt 텍스트 확인

---

## 🎓 Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [a11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
