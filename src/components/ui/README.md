# BebeCare UI Component Library

Design System 기반의 재사용 가능한 UI 컴포넌트 라이브러리입니다.

## 📚 Documentation

전체 디자인 시스템: [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md)

---

## 🎨 Components

### Button

다양한 variant와 크기를 지원하는 버튼 컴포넌트.

**Variants:**
- `primary` (default): 주요 CTA
- `secondary`: 보조 액션
- `outline`: 테두리만 있는 스타일
- `ghost`: 배경 없는 스타일
- `destructive`: 삭제 등 주의 필요한 액션

**Sizes:** `sm`, `md` (default), `lg`, `xl`

**Props:**
- `loading`: 로딩 상태 (스피너 표시)
- `icon`: 왼쪽 아이콘
- `iconAfter`: 오른쪽 아이콘
- `fullWidth`: 전체 너비

**Usage:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">
  Click me
</Button>

<Button variant="outline" loading>
  Loading...
</Button>

<Button icon={<PlusIcon />} fullWidth>
  Add Item
</Button>
```

---

### Input

텍스트 입력 컴포넌트. 에러 상태 및 아이콘 지원.

**Props:**
- `error`: 에러 상태 (빨간 테두리)
- `icon`: 왼쪽 아이콘
- `iconAfter`: 오른쪽 아이콘

**Usage:**
```tsx
import { Input } from '@/components/ui';

<Input type="email" placeholder="your@email.com" />

<Input error placeholder="Invalid email" />

<Input icon={<SearchIcon />} placeholder="Search..." />
```

---

### Card

카드 컨테이너 컴포넌트. 다양한 shadow와 hover 효과 지원.

**Variants:**
- `shadow`: `none`, `sm`, `base` (default), `md`, `lg`
- `hover`: `none` (default), `lift`, `shadow`
- `padding`: `none`, `sm`, `md` (default), `lg`

**Sub-components:**
- `CardHeader`: 헤더 영역
- `CardTitle`: 제목
- `CardDescription`: 설명
- `CardContent`: 본문
- `CardFooter`: 푸터

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card shadow="lg" hover="lift">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

---

### Badge

작은 라벨/태그 컴포넌트.

**Variants:**
- `default`: 브랜드 컬러 (dusty-rose)
- `secondary`: 세이지 그린
- `success`: 초록
- `warning`: 주황
- `error`: 빨강
- `info`: 파랑
- `outline`: 테두리만

**Sizes:** `sm`, `md` (default), `lg`

**Usage:**
```tsx
import { Badge } from '@/components/ui';

<Badge>Default</Badge>

<Badge variant="success">Completed</Badge>

<Badge variant="warning" icon={<AlertIcon />}>
  Warning
</Badge>
```

---

### Avatar

프로필 이미지 또는 이니셜 표시.

**Sizes:** `sm`, `md` (default), `lg`, `xl`, `2xl`

**Props:**
- `src`: 이미지 URL
- `alt`: 대체 텍스트
- `fallback`: 이미지 없을 때 표시할 이니셜 (최대 2자)

**Usage:**
```tsx
import { Avatar } from '@/components/ui';

<Avatar src="/profile.jpg" alt="User name" />

<Avatar fallback="JD" size="lg" />
```

---

## 🛠️ Utility Functions

### `cn(...inputs)`

Tailwind CSS 클래스를 병합하는 유틸리티 함수 (`clsx` + `tailwind-merge`).

```tsx
import { cn } from '@/lib/utils';

<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## 🎯 Design Principles

1. **Consistency**: 모든 컴포넌트는 동일한 디자인 토큰 사용
2. **Accessibility**: WCAG AA 기준 준수, 키보드 네비게이션 지원
3. **Flexibility**: CVA를 통한 유연한 variant 시스템
4. **Type Safety**: TypeScript로 타입 안전성 보장
5. **Performance**: React.forwardRef 사용, 불필요한 리렌더 방지

---

## 📦 Tech Stack

- **CVA (class-variance-authority)**: Variant 관리
- **clsx**: 조건부 클래스 병합
- **tailwind-merge**: Tailwind 클래스 충돌 해결
- **TypeScript**: 타입 안전성

---

## 🚀 Upcoming Components

- [ ] Select (custom dropdown)
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Textarea
- [ ] Modal
- [ ] Toast
- [ ] Tabs
- [ ] Accordion
- [ ] Datepicker

---

## 💡 Tips

1. **Import from index**: `import { Button, Input } from '@/components/ui'`
2. **Extend with className**: 모든 컴포넌트는 `className` prop 지원
3. **TypeScript autocomplete**: variant, size 등 props는 자동완성 지원
4. **Accessibility**: `aria-label`, `role` 등 필요 시 추가 권장

---

## 📝 Contributing

새 컴포넌트 추가 시:
1. `DESIGN_SYSTEM.md` 확인
2. CVA로 variant 정의
3. TypeScript 타입 정의
4. `index.ts`에 export 추가
5. README 업데이트
