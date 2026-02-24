# Design Patterns - BebeCare

디자인 시스템 기반의 공통 UI 패턴 라이브러리입니다.

---

## Form Patterns

### 기본 Form

**Do's:**
- Label 항상 사용
- Required 필드 명시 (`*` 표시)
- 에러 메시지 구체적으로 작성
- Submit 버튼은 form 하단에 배치

**Don'ts:**
- Placeholder를 Label 대신 사용하지 않기
- 에러 메시지 없이 빨간 테두리만 표시하지 않기

```tsx
// ✅ Good
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="email" required>이메일</Label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      {errors.email && <p className="text-xs text-error">{errors.email}</p>}
    </div>

    <Button type="submit" variant="primary" fullWidth loading={loading}>
      {loading ? '전송 중...' : '전송'}
    </Button>
  </div>
</form>
```

### Checkbox/Radio Group

```tsx
// ✅ Good - 명확한 그룹핑
<div className="space-y-2">
  <Label>알림 설정</Label>
  <div className="space-y-2">
    <Checkbox label="이메일 알림" checked={email} onChange={...} />
    <Checkbox label="푸시 알림" checked={push} onChange={...} />
    <Checkbox label="SMS 알림" checked={sms} onChange={...} />
  </div>
</div>
```

### Multi-Step Forms

```tsx
// ✅ Good - Progress 표시
<div className="space-y-6">
  <Progress value={(currentStep / totalSteps) * 100} showLabel />
  
  {/* Step content */}
  
  <div className="flex gap-3">
    {currentStep > 1 && (
      <Button variant="outline" onClick={prevStep}>이전</Button>
    )}
    <Button variant="primary" onClick={nextStep} disabled={!canProceed()}>
      {currentStep === totalSteps ? '완료' : '다음'}
    </Button>
  </div>
</div>
```

---

## List Patterns

### Basic List

```tsx
// ✅ Good - Card 사용, 일관된 간격
<div className="space-y-3">
  {items.map((item) => (
    <Card key={item.id} shadow="sm" padding="md" hover="lift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={item.avatar} fallback={item.name[0]} />
          <div>
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">...</Button>
      </div>
    </Card>
  ))}
</div>
```

### List with Actions

```tsx
// ✅ Good - 명확한 액션 구분
<Card>
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <h3>{item.title}</h3>
      <p className="text-sm text-gray-500">{item.subtitle}</p>
    </div>
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" icon={<Edit />}>수정</Button>
      <Button variant="ghost" size="sm" icon={<Trash />}>삭제</Button>
    </div>
  </div>
</Card>
```

---

## Empty State Patterns

### No Data

```tsx
// ✅ Good - 아이콘 + 설명 + CTA
<Card padding="lg" className="text-center py-12">
  <Baby className="h-16 w-16 text-gray-300 mx-auto mb-4" />
  <h3 className="text-h4 font-bold text-gray-900 mb-2">
    아직 기록이 없어요
  </h3>
  <p className="text-body text-gray-500 mb-6">
    첫 기록을 추가해보세요
  </p>
  <Button variant="primary" icon={<Plus />}>
    기록 추가
  </Button>
</Card>
```

### Error State

```tsx
// ✅ Good - 에러 아이콘 + 재시도 버튼
<Card padding="lg" className="text-center py-12">
  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
  <h3 className="text-h4 font-bold text-gray-900 mb-2">
    데이터를 불러올 수 없습니다
  </h3>
  <p className="text-body text-gray-500 mb-6">
    네트워크 연결을 확인하고 다시 시도해주세요
  </p>
  <Button variant="outline" onClick={retry}>
    다시 시도
  </Button>
</Card>
```

---

## Loading Patterns

### Skeleton Loading

```tsx
// ✅ Good - 실제 컨텐츠와 유사한 Skeleton
{loading ? (
  <Card padding="md">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
    </div>
  </Card>
) : (
  <Card>...</Card>
)}
```

### Spinner Loading

```tsx
// ✅ Good - 중앙 정렬 + 설명
{loading ? (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-dusty-rose-500" />
    <p className="text-sm text-gray-500 mt-4">로딩 중...</p>
  </div>
) : (
  <div>...</div>
)}
```

---

## Modal Patterns

### Confirmation Modal

```tsx
// ✅ Good - 명확한 제목 + 설명 + 액션
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="정말 삭제하시겠습니까?"
  description="이 작업은 되돌릴 수 없습니다."
>
  <div className="space-y-4">
    <p className="text-sm text-gray-600">
      '{item.name}'을(를) 삭제하시겠습니까?
    </p>
    <div className="flex gap-3 justify-end">
      <Button variant="outline" onClick={() => setOpen(false)}>
        취소
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        삭제
      </Button>
    </div>
  </div>
</Modal>
```

---

## Feedback Patterns

### Toast Notifications

```tsx
// ✅ Good - variant에 따른 적절한 메시지
const { addToast } = useToast();

// Success
addToast({
  title: '저장 완료',
  description: '변경사항이 저장되었습니다.',
  variant: 'success',
});

// Error
addToast({
  title: '저장 실패',
  description: '다시 시도해주세요.',
  variant: 'error',
});
```

### Inline Validation

```tsx
// ✅ Good - 즉각적인 피드백
<Input
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  }}
  error={emailError}
/>
{emailError && (
  <p className="text-xs text-error mt-1">{emailError}</p>
)}
```

---

## Responsive Patterns

### Mobile-First Grid

```tsx
// ✅ Good - 모바일 우선, 점진적 확장
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### Responsive Navigation

```tsx
// ✅ Good - 모바일: 하단 탭, 데스크탑: 사이드바
<div className="lg:hidden fixed bottom-0 inset-x-0">
  {/* Bottom Tab Bar */}
</div>

<div className="hidden lg:block fixed left-0 top-0 h-full w-64">
  {/* Sidebar */}
</div>
```

---

## Accessibility Best Practices

### 1. Semantic HTML

```tsx
// ✅ Good
<button type="button" onClick={...}>Click me</button>

// ❌ Bad
<div onClick={...}>Click me</div>
```

### 2. ARIA Labels

```tsx
// ✅ Good
<button aria-label="Close modal" onClick={onClose}>
  <X className="h-4 w-4" />
</button>

// ❌ Bad
<button onClick={onClose}>
  <X className="h-4 w-4" />
</button>
```

### 3. Keyboard Navigation

```tsx
// ✅ Good - Tab 순서, Enter/Space 지원
<Modal open={open} onClose={onClose}>
  {/* Modal은 Escape 키 지원 */}
  <Button>Primary Action</Button> {/* 첫 번째 포커스 */}
  <Button variant="outline">Cancel</Button>
</Modal>
```

### 4. Focus Visible

```tsx
// ✅ Good - focus-visible 스타일
<button className="focus-visible:ring-2 focus-visible:ring-dusty-rose-500">
  Click me
</button>
```

---

## Color Contrast

모든 텍스트는 WCAG AA 기준 준수:
- 일반 텍스트: 최소 4.5:1
- 큰 텍스트 (18px+): 최소 3:1

**검증 도구:**
- WebAIM Contrast Checker
- Chrome DevTools Lighthouse

---

## Do's and Don'ts Summary

### Do's ✅
- 일관된 간격 사용 (4px grid)
- Loading 상태 명시
- 에러 메시지 구체적으로 작성
- 접근성 고려 (semantic HTML, ARIA)
- 모바일 우선 디자인

### Don'ts ❌
- 하드코딩된 색상 사용
- Placeholder를 Label 대신 사용
- 에러 없이 실패 상태만 표시
- 키보드 네비게이션 무시
- 컬러 대비 부족

---

## References

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 디자인 토큰 및 컴포넌트
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
