# BebeCare 디자인 시스템

## 색상 (Color Tokens)

모든 색상은 `globals.css`의 `@theme` 블록에서 **단일 소스**로 관리합니다.
`tailwind.config.ts`에 색상을 직접 정의하지 마세요.

### 브랜드 컬러

| 토큰 | HEX | 용도 |
|---|---|---|
| `dusty-rose` | `#C2728A` | 메인 브랜드 (= primary) |
| `dusty-rose-light` | `#D4A0B0` | 호버, 배경 |
| `dusty-rose-dark` | `#A85C73` | 강조, 호버 다크 |
| `sage` | `#7C9A82` | 보조 브랜드 (= secondary) |
| `sage-light` | `#A3BDA8` | 보조 배경 |

### 시맨틱 Alias

| 토큰 | 매핑 | 용도 |
|---|---|---|
| `primary` | `#C2728A` (dusty-rose) | 주요 CTA, 강조 |
| `primary-light` | `#D4A0B0` | 배경 |
| `primary-dark` | `#A85C73` | 호버 |
| `secondary` | `#7C9A82` (sage) | 보조 액션 |
| `success` | `#22C55E` | 완료, 성공 |
| `warning` | `#EF4444` | 경고, 긴급 |

### 서피스

| 토큰 | HEX | 용도 |
|---|---|---|
| `surface` | `#FEF7F2` | 기본 배경 |
| `surface-warm` | `#FFF9F5` | 따뜻한 배경 |
| `border` | `#F0E6E0` | 카드/섹션 테두리 |

## 사용 규칙

1. **색상 추가/변경은 `globals.css` `@theme`에서만** — `tailwind.config.ts`에 색상 직접 하드코딩 금지
2. **컴포넌트에서는 Tailwind 클래스 사용** — `bg-dusty-rose`, `text-sage` 등
3. **인라인 스타일로 색상 지정 금지** (기존 인라인 스타일은 #25에서 마이그레이션 예정)
