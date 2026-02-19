# 베베케어 디자인 시스템

## 브랜드 컬러

| 이름 | HEX | Tailwind 클래스 | 용도 |
|---|---|---|---|
| Dusty Rose (Primary) | #C2728A | `dusty-rose`, `primary` | 주요 액센트, CTA 버튼, 강조 |
| Dusty Rose Light | #D4A0B0 | `dusty-rose-light` | 호버, 배경 틴트 |
| Dusty Rose Dark | #A85C73 | `dusty-rose-dark` | 호버 다크, 텍스트 강조 |
| Sage (Secondary) | #7C9A82 | `sage`, `secondary` | 보조 액센트, 건강/자연 |
| Sage Light | #A3BDA8 | `sage-light` | 배경 틴트 |

## Surface & Border

| 이름 | HEX | 클래스 | 용도 |
|---|---|---|---|
| Surface | #FEF7F2 | `surface` | 기본 배경 |
| Surface Warm | #FFF9F5 | `surface-warm` | body 배경 |
| Border | #F0E6E0 | `border` | 카드/입력 테두리 |

## 시맨틱 컬러

| 이름 | HEX | 클래스 | 용도 |
|---|---|---|---|
| Success | #10B981 | `success` | 완료, 긍정 |
| Warning | #EF4444 | `warning` | 경고, 높은 우선순위 |

## 사용 규칙
- **Primary 버튼**: `bg-dusty-rose text-white hover:bg-dusty-rose-dark`
- **Secondary 버튼**: `bg-sage text-white hover:bg-sage/80`
- **카드**: `.card` 컴포넌트 클래스 사용 (globals.css 정의)
- **입력 포커스**: `focus:border-dusty-rose focus:ring-1 focus:ring-dusty-rose/20`
