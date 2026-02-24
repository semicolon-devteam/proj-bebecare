# BebeCare Design System

## Design Philosophy
따뜻하고 친근한 임신·육아 경험을 전달하는 디자인.
- **Warm & Gentle**: 부드러운 컬러와 라운드 처리
- **Clear & Simple**: 복잡하지 않은 정보 위계
- **Accessible**: 모든 사용자를 위한 접근성 보장

---

## Color System

### Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| Dusty Rose 500 (Primary) | `#C2728A` | 주요 CTA, 브랜드 강조 |
| Sage Green 500 (Secondary) | `#7C9A82` | 보조 액션, 포인트 |

### Dusty Rose Scale
```
50:  #FFF0F3  // 가장 연한 배경
100: #FFE0E8
200: #FFC0D1
300: #FFA0BA
400: #E189A3
500: #C2728A  // Primary
600: #A85C73
700: #8D465C
800: #6B3A4A
900: #4A2833  // 가장 진한 텍스트
```

### Sage Green Scale
```
50:  #F0F7F1
100: #D9EBE0
200: #B3D7C1
300: #8DC3A2
400: #7C9A82  // Secondary
500: #6B8672
600: #5A7262
700: #495E52
800: #384A42
900: #273632
```

### Neutral Scale (Gray)
```
50:  #F9FAFB
100: #F3F4F6
200: #E5E7EB
300: #D1D5DB
400: #9CA3AF
500: #6B7280
600: #4B5563
700: #374151
800: #1F2937
900: #111827
```

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` (Green 500) | 성공 메시지, 완료 상태 |
| Warning | `#F59E0B` (Amber 500) | 주의 메시지 |
| Error | `#EF4444` (Red 500) | 에러, 삭제 액션 |
| Info | `#3B82F6` (Blue 500) | 정보 메시지 |

### Surface Colors
```
Surface Warm: #FFF9F5  // 기본 배경
Surface:      #FEF7F2  // 카드 배경
Border:       #F0E6E0  // 테두리
```

---

## Typography

### Font Family
- **Primary**: `system-ui, -apple-system, "Segoe UI", sans-serif`
- **Korean**: 시스템 기본 한글 폰트 (맑은 고딕, 애플 산돌고딕 Neo)

### Type Scale
| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| H1 | 2.25rem (36px) | 2.5rem (40px) | 700 (Bold) | 페이지 타이틀 |
| H2 | 1.875rem (30px) | 2.25rem (36px) | 700 (Bold) | 섹션 제목 |
| H3 | 1.5rem (24px) | 2rem (32px) | 600 (SemiBold) | 카드 제목 |
| H4 | 1.25rem (20px) | 1.75rem (28px) | 600 (SemiBold) | 서브 제목 |
| Body Large | 1.125rem (18px) | 1.75rem (28px) | 400 (Regular) | 큰 본문 |
| Body | 1rem (16px) | 1.5rem (24px) | 400 (Regular) | 기본 본문 |
| Body Small | 0.875rem (14px) | 1.25rem (20px) | 400 (Regular) | 작은 본문 |
| Caption | 0.75rem (12px) | 1rem (16px) | 400 (Regular) | 캡션, 메타 정보 |

---

## Spacing System (4px Grid)

```
0:   0px
1:   4px   (0.25rem)
2:   8px   (0.5rem)
3:   12px  (0.75rem)
4:   16px  (1rem)
5:   20px  (1.25rem)
6:   24px  (1.5rem)
8:   32px  (2rem)
10:  40px  (2.5rem)
12:  48px  (3rem)
16:  64px  (4rem)
20:  80px  (5rem)
24:  96px  (6rem)
```

---

## Border Radius

```
none:   0px
sm:     0.25rem (4px)
base:   0.5rem (8px)
md:     0.75rem (12px)
lg:     1rem (16px)
xl:     1.25rem (20px)
2xl:    1.5rem (24px)
3xl:    2rem (32px)
full:   9999px
```

### Component-specific
```
button:    0.75rem (12px)
input:     0.75rem (12px)
card:      1.25rem (20px)
modal:     1.5rem (24px)
```

---

## Shadow System

### Warm Shadows (Brand Color Tint)
```
warm-sm:  0 1px 4px rgba(194, 114, 138, 0.04)
warm:     0 2px 8px rgba(194, 114, 138, 0.06)
warm-md:  0 4px 16px rgba(194, 114, 138, 0.08)
warm-lg:  0 8px 24px rgba(194, 114, 138, 0.10)
warm-xl:  0 12px 32px rgba(194, 114, 138, 0.12)
```

### Neutral Shadows
```
sm:   0 1px 2px rgba(0, 0, 0, 0.05)
base: 0 1px 3px rgba(0, 0, 0, 0.1)
md:   0 4px 6px rgba(0, 0, 0, 0.1)
lg:   0 10px 15px rgba(0, 0, 0, 0.1)
xl:   0 20px 25px rgba(0, 0, 0, 0.1)
```

---

## Component States

### Button States
```
Default:  background: dusty-rose-500
Hover:    background: dusty-rose-600, shadow: warm-md
Active:   background: dusty-rose-700
Disabled: opacity: 0.5, cursor: not-allowed
Focus:    ring: 2px dusty-rose-500 with 2px offset
```

### Input States
```
Default:  border: gray-300
Focus:    border: dusty-rose-500, ring: 1px dusty-rose-500/20
Error:    border: red-500, ring: 1px red-500/20
Disabled: background: gray-50, cursor: not-allowed
```

---

## Animation & Transition

### Duration
```
fast:     150ms
base:     200ms
slow:     300ms
slower:   500ms
```

### Easing
```
ease-out:  cubic-bezier(0, 0, 0.2, 1)
ease-in:   cubic-bezier(0.4, 0, 1, 1)
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Accessibility Guidelines

### Color Contrast
- Text: 최소 4.5:1 (WCAG AA)
- Large Text (18px+): 최소 3:1
- UI Components: 최소 3:1

### Focus Indicators
- 모든 interactive 요소에 focus-visible 스타일 필수
- Outline: 2px solid primary color, 2px offset

### Touch Targets
- 최소 44x44px (모바일)
- 버튼 간 최소 8px 간격

---

## Responsive Breakpoints

```
sm:  640px   // 모바일 가로
md:  768px   // 태블릿
lg:  1024px  // 데스크탑
xl:  1280px  // 큰 데스크탑
2xl: 1536px  // 초대형
```

### Layout Max Widths
```
Mobile:  100%
Tablet:  768px
Desktop: 1024px
```

---

## Component Library Checklist

### Phase 1: Base Components
- [ ] Button (variants: primary, secondary, ghost, outline)
- [ ] Input (text, email, password, date, select)
- [ ] Card
- [ ] Badge
- [ ] Avatar
- [ ] Modal
- [ ] Toast

### Phase 2: Form Components
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Textarea
- [ ] Select (custom dropdown)

### Phase 3: Complex Components
- [ ] Navigation (Header, Bottom Tab)
- [ ] Sidebar
- [ ] Tabs
- [ ] Accordion
- [ ] Datepicker

---

## References
- Tailwind CSS: https://tailwindcss.com
- Radix UI: https://radix-ui.com
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
