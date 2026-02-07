# API 명세 (API Specification)

> BebeCare REST API 및 Supabase RPC 함수 명세

**작성일**: 2026-02-07
**버전**: v1.0 (MVP)

---

## 📋 목차

1. [API 개요](#api-개요)
2. [인증 시스템](#인증-시스템)
3. [프로필 관리 API](#프로필-관리-api)
4. [자녀 관리 API](#자녀-관리-api)
5. [AI 대화 API](#ai-대화-api)
6. [타임라인 API](#타임라인-api)
7. [Supabase RPC 함수](#supabase-rpc-함수)
8. [에러 처리](#에러-처리)
9. [속도 제한 및 성능](#속도-제한-및-성능)

---

## API 개요

### 기본 URL
```
# Production
https://bebecare.vercel.app/api

# Development
http://localhost:3000/api
```

### 요청/응답 형식
- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **Charset**: `UTF-8`

### 공통 응답 형식
```typescript
// 성공 응답
{
  "data": T,           // 응답 데이터
  "meta"?: {           // 메타데이터 (옵션)
    "total": number,
    "page": number,
    "limit": number
  }
}

// 에러 응답
{
  "error": {
    "code": string,    // 에러 코드 (예: UNAUTHORIZED, NOT_FOUND)
    "message": string, // 사용자 친화적 에러 메시지
    "details"?: any    // 추가 디버깅 정보 (개발 환경만)
  }
}
```

---

## 인증 시스템

### Supabase Auth 기반 인증

**인증 방식**: Session-based with JWT
**인증 헤더**:
```http
Authorization: Bearer <supabase_jwt_token>
```

### 회원가입
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!",
  "metadata": {
    "name": "홍길동"
  }
}
```

**응답**:
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2026-02-07T10:00:00Z"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_in": 3600
    }
  }
}
```

### 로그인
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**응답**: 회원가입과 동일

### 로그아웃
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

**응답**:
```json
{
  "data": {
    "message": "로그아웃되었습니다."
  }
}
```

---

## 프로필 관리 API

### 프로필 조회

**Endpoint**: `GET /api/profile`
**인증**: 필수
**설명**: 현재 로그인한 사용자의 프로필 조회

**요청**:
```http
GET /api/profile
Authorization: Bearer <jwt_token>
```

**응답**:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "is_pregnant": true,
    "due_date": "2026-08-15",
    "pregnancy_week": 24,
    "is_working": true,
    "region_province": "서울특별시",
    "region_city": "강남구",
    "created_at": "2026-02-07T10:00:00Z",
    "updated_at": "2026-02-07T10:00:00Z"
  }
}
```

**에러**:
- `401 UNAUTHORIZED`: 인증 실패
- `404 NOT_FOUND`: 프로필 미생성 (온보딩 필요)

---

### 프로필 생성 (온보딩)

**Endpoint**: `POST /api/profile`
**인증**: 필수
**설명**: 신규 사용자 프로필 생성 (온보딩 완료)

**요청**:
```http
POST /api/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "is_pregnant": true,
  "due_date": "2026-08-15",
  "is_working": true,
  "region_province": "서울특별시",
  "region_city": "강남구"
}
```

**TypeScript 타입**:
```typescript
interface CreateProfileRequest {
  is_pregnant: boolean;
  due_date?: string;          // ISO 8601 date (임신 중인 경우 필수)
  is_working: boolean;
  region_province: string;    // 시·도 (예: "서울특별시")
  region_city: string;        // 시·군·구 (예: "강남구")
}

interface ProfileResponse {
  id: string;
  user_id: string;
  is_pregnant: boolean;
  due_date: string | null;
  pregnancy_week: number | null;  // 자동 계산
  is_working: boolean;
  region_province: string;
  region_city: string;
  created_at: string;
  updated_at: string;
}
```

**응답**:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "is_pregnant": true,
    "due_date": "2026-08-15",
    "pregnancy_week": 24,
    "is_working": true,
    "region_province": "서울특별시",
    "region_city": "강남구",
    "created_at": "2026-02-07T10:00:00Z",
    "updated_at": "2026-02-07T10:00:00Z"
  }
}
```

**에러**:
- `400 BAD_REQUEST`: 필수 필드 누락 또는 유효성 검증 실패
- `409 CONFLICT`: 이미 프로필이 존재함

**유효성 검증**:
- `is_pregnant === true`이면 `due_date` 필수
- `due_date`는 오늘 이후 날짜여야 함
- `region_province`, `region_city`는 비어있지 않아야 함

---

### 프로필 수정

**Endpoint**: `PATCH /api/profile`
**인증**: 필수
**설명**: 프로필 정보 부분 수정

**요청**:
```http
PATCH /api/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "due_date": "2026-09-01",
  "is_working": false
}
```

**TypeScript 타입**:
```typescript
interface UpdateProfileRequest {
  due_date?: string;
  is_working?: boolean;
  region_province?: string;
  region_city?: string;
}
```

**응답**: 프로필 조회와 동일

**에러**:
- `400 BAD_REQUEST`: 유효성 검증 실패
- `404 NOT_FOUND`: 프로필 미존재

---

## 자녀 관리 API

### 자녀 목록 조회

**Endpoint**: `GET /api/children`
**인증**: 필수
**설명**: 현재 사용자의 자녀 목록 조회

**요청**:
```http
GET /api/children
Authorization: Bearer <jwt_token>
```

**응답**:
```json
{
  "data": {
    "children": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "김아이",
        "birth_date": "2025-10-15",
        "gender": "male",
        "age_months": 3,
        "created_at": "2026-01-01T10:00:00Z",
        "updated_at": "2026-01-01T10:00:00Z"
      },
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "김둘째",
        "birth_date": "2023-05-20",
        "gender": "female",
        "age_months": 32,
        "created_at": "2024-06-01T10:00:00Z",
        "updated_at": "2024-06-01T10:00:00Z"
      }
    ]
  }
}
```

**TypeScript 타입**:
```typescript
interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;         // ISO 8601 date
  gender: 'male' | 'female' | 'other';
  age_months: number;         // 자동 계산
  created_at: string;
  updated_at: string;
}

interface ChildrenListResponse {
  children: Child[];
}
```

---

### 자녀 추가

**Endpoint**: `POST /api/children`
**인증**: 필수
**설명**: 새 자녀 추가 (최대 5명)

**요청**:
```http
POST /api/children
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "김아이",
  "birth_date": "2025-10-15",
  "gender": "male"
}
```

**TypeScript 타입**:
```typescript
interface CreateChildRequest {
  name: string;
  birth_date: string;         // ISO 8601 date
  gender: 'male' | 'female' | 'other';
}
```

**응답**:
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "김아이",
    "birth_date": "2025-10-15",
    "gender": "male",
    "age_months": 3,
    "created_at": "2026-02-07T10:00:00Z",
    "updated_at": "2026-02-07T10:00:00Z"
  }
}
```

**에러**:
- `400 BAD_REQUEST`: 필수 필드 누락 또는 유효성 검증 실패
- `409 CONFLICT`: 이미 5명의 자녀가 등록됨

**유효성 검증**:
- `name`은 1-100자
- `birth_date`는 오늘 이전 날짜여야 함
- `gender`는 'male', 'female', 'other' 중 하나

---

### 자녀 정보 수정

**Endpoint**: `PATCH /api/children/:id`
**인증**: 필수
**설명**: 자녀 정보 부분 수정

**요청**:
```http
PATCH /api/children/uuid-123
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "김아이 (변경)",
  "gender": "female"
}
```

**TypeScript 타입**:
```typescript
interface UpdateChildRequest {
  name?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
}
```

**응답**: 자녀 추가와 동일

**에러**:
- `400 BAD_REQUEST`: 유효성 검증 실패
- `403 FORBIDDEN`: 다른 사용자의 자녀 수정 시도
- `404 NOT_FOUND`: 자녀 정보 미존재

---

### 자녀 삭제

**Endpoint**: `DELETE /api/children/:id`
**인증**: 필수
**설명**: 자녀 정보 삭제

**요청**:
```http
DELETE /api/children/uuid-123
Authorization: Bearer <jwt_token>
```

**응답**:
```json
{
  "data": {
    "message": "자녀 정보가 삭제되었습니다.",
    "deleted_id": "uuid-123"
  }
}
```

**에러**:
- `403 FORBIDDEN`: 다른 사용자의 자녀 삭제 시도
- `404 NOT_FOUND`: 자녀 정보 미존재

---

## AI 대화 API

### AI 챗봇 대화

**Endpoint**: `POST /api/ai/chat`
**인증**: 필수
**설명**: OpenAI GPT-4o-mini 기반 AI 조언 생성

**요청**:
```http
POST /api/ai/chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "임신 24주인데 어떤 검사를 받아야 하나요?",
  "conversation_id": "uuid-optional"
}
```

**TypeScript 타입**:
```typescript
interface ChatRequest {
  message: string;
  conversation_id?: string;  // 옵션: 기존 대화 이어가기
}

interface ChatResponse {
  conversation_id: string;
  message: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
  context: {
    pregnancy_week?: number;
    age_months?: number;
    is_working: boolean;
    region: string;
  };
}
```

**응답**:
```json
{
  "data": {
    "conversation_id": "uuid",
    "message": {
      "role": "assistant",
      "content": "임신 24주차에는 임신성 당뇨 검사(50g 포도당 부하 검사)를 받아야 합니다...",
      "timestamp": "2026-02-07T10:05:00Z"
    },
    "context": {
      "pregnancy_week": 24,
      "is_working": true,
      "region": "서울특별시 강남구"
    }
  }
}
```

**에러**:
- `400 BAD_REQUEST`: 메시지가 비어있음
- `429 TOO_MANY_REQUESTS`: OpenAI API 속도 제한 초과
- `500 INTERNAL_SERVER_ERROR`: OpenAI API 호출 실패

**프롬프트 예시**:
```typescript
const systemPrompt = `당신은 임신·출산·육아 전문 AI 어시스턴트입니다.

사용자 정보:
- 임신 주차: ${profile.pregnancy_week}주
- 출산예정일: ${profile.due_date}
- 직장: ${profile.is_working ? '근무 중' : '비근무'}
- 지역: ${profile.region_province} ${profile.region_city}

사용자의 질문에 맞춤형 조언을 제공하세요.
- 의료 정보는 참고용임을 명시하세요.
- 전문의 상담이 필요한 경우 안내하세요.
- 지역별 정부 지원금 정보를 제공할 때는 출처를 명시하세요.`;
```

---

### 대화 히스토리 조회

**Endpoint**: `GET /api/conversations`
**인증**: 필수
**설명**: 사용자의 모든 대화 목록 조회

**요청**:
```http
GET /api/conversations?limit=10&offset=0
Authorization: Bearer <jwt_token>
```

**쿼리 파라미터**:
- `limit`: 결과 개수 (기본값: 10, 최대: 50)
- `offset`: 페이지네이션 오프셋 (기본값: 0)

**응답**:
```json
{
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "title": "임신 24주 검사 문의",
        "messages": [
          {
            "role": "user",
            "content": "임신 24주인데 어떤 검사를 받아야 하나요?",
            "timestamp": "2026-02-07T10:00:00Z"
          },
          {
            "role": "assistant",
            "content": "임신 24주차에는...",
            "timestamp": "2026-02-07T10:00:05Z"
          }
        ],
        "created_at": "2026-02-07T10:00:00Z",
        "updated_at": "2026-02-07T10:00:05Z"
      }
    ]
  },
  "meta": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

**TypeScript 타입**:
```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;              // 첫 번째 메시지에서 자동 생성
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface ConversationsListResponse {
  conversations: Conversation[];
}
```

---

### 특정 대화 조회

**Endpoint**: `GET /api/conversations/:id`
**인증**: 필수
**설명**: 특정 대화 상세 조회

**요청**:
```http
GET /api/conversations/uuid-123
Authorization: Bearer <jwt_token>
```

**응답**: 대화 히스토리 조회의 단일 대화 객체

**에러**:
- `403 FORBIDDEN`: 다른 사용자의 대화 조회 시도
- `404 NOT_FOUND`: 대화 미존재

---

### 대화 삭제

**Endpoint**: `DELETE /api/conversations/:id`
**인증**: 필수
**설명**: 대화 히스토리 삭제

**요청**:
```http
DELETE /api/conversations/uuid-123
Authorization: Bearer <jwt_token>
```

**응답**:
```json
{
  "data": {
    "message": "대화가 삭제되었습니다.",
    "deleted_id": "uuid-123"
  }
}
```

---

## 타임라인 API

### 타임라인 조회

**Endpoint**: `GET /api/timelines`
**인증**: 필수
**설명**: 사용자의 시기별 타임라인 조회

**요청**:
```http
GET /api/timelines?status=pending&limit=20
Authorization: Bearer <jwt_token>
```

**쿼리 파라미터**:
- `status`: 필터 (pending | completed | all, 기본값: all)
- `limit`: 결과 개수 (기본값: 20, 최대: 100)
- `child_id`: 특정 자녀의 타임라인만 조회 (옵션)

**응답**:
```json
{
  "data": {
    "timelines": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "child_id": null,
        "event_type": "임신성 당뇨 검사",
        "event_category": "산전검사",
        "description": "임신 24주차 임신성 당뇨 검사 (50g 포도당 부하 검사)",
        "scheduled_at": "2026-02-15T09:00:00Z",
        "completed": false,
        "notification_sent": false,
        "notification_days": [7, 3, 1],
        "metadata": {
          "importance": "high",
          "location": "산부인과",
          "estimated_cost": "보험 적용"
        },
        "created_at": "2026-02-07T10:00:00Z",
        "updated_at": "2026-02-07T10:00:00Z"
      }
    ]
  },
  "meta": {
    "total": 45,
    "pending": 12,
    "completed": 33
  }
}
```

**TypeScript 타입**:
```typescript
interface Timeline {
  id: string;
  user_id: string;
  child_id: string | null;
  event_type: string;
  event_category: string;
  description: string;
  scheduled_at: string;
  completed: boolean;
  notification_sent: boolean;
  notification_days: number[];  // [7, 3, 1] = 7일 전, 3일 전, 1일 전 알림
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface TimelinesListResponse {
  timelines: Timeline[];
}
```

---

### 타임라인 완료 처리

**Endpoint**: `PATCH /api/timelines/:id`
**인증**: 필수
**설명**: 타임라인 이벤트 완료 처리

**요청**:
```http
PATCH /api/timelines/uuid-123
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "completed": true
}
```

**TypeScript 타입**:
```typescript
interface UpdateTimelineRequest {
  completed: boolean;
}
```

**응답**:
```json
{
  "data": {
    "id": "uuid-123",
    "completed": true,
    "updated_at": "2026-02-07T10:10:00Z"
  }
}
```

**에러**:
- `403 FORBIDDEN`: 다른 사용자의 타임라인 수정 시도
- `404 NOT_FOUND`: 타임라인 미존재

---

## Supabase RPC 함수

### generate_pregnancy_timeline()

**설명**: 임신 주차 기반 타임라인 자동 생성
**트리거**: 프로필 생성 시 (is_pregnant = true)
**호출 방식**: Database Trigger (자동 실행)

**생성 타임라인**:
- 임신 22주: 태아 보험 가입
- 임신 24주: 임신성 당뇨 검사
- 임신 34주: 출산휴가 신청
- 임신 36주: 출산 가방 준비

**함수 시그니처**:
```sql
CREATE OR REPLACE FUNCTION generate_pregnancy_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- 임신 주차별 타임라인 자동 생성
  -- (database-schema.sql 참조)
END;
$$ LANGUAGE plpgsql;
```

---

### generate_baby_timeline()

**설명**: 아기 개월 수 기반 타임라인 자동 생성
**트리거**: 자녀 추가 시
**호출 방식**: Database Trigger (자동 실행)

**생성 타임라인**:
- 생후 0-1개월: 예방접종 (BCG, B형간염 1차)
- 생후 2개월: 예방접종 (DTaP, 폴리오, Hib 1차)
- 생후 4-6개월: 이유식 시작
- 생후 6개월: 예방접종 (DTaP, 폴리오, Hib 2차)
- 생후 12개월: 국가건강검진 (영유아 1차)

**함수 시그니처**:
```sql
CREATE OR REPLACE FUNCTION generate_baby_timeline()
RETURNS TRIGGER AS $$
BEGIN
  -- 아기 개월 수별 타임라인 자동 생성
  -- (database-schema.sql 참조)
END;
$$ LANGUAGE plpgsql;
```

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 유효성 검증 실패 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 부족 |
| 404 | Not Found | 리소스 미존재 |
| 409 | Conflict | 리소스 충돌 (중복 생성) |
| 429 | Too Many Requests | 속도 제한 초과 |
| 500 | Internal Server Error | 서버 오류 |

### 에러 응답 예시

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "출산예정일은 오늘 이후 날짜여야 합니다.",
    "details": {
      "field": "due_date",
      "value": "2025-01-01",
      "constraint": "must be future date"
    }
  }
}
```

### 에러 코드 목록

```typescript
enum ErrorCode {
  // 인증 및 권한
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 유효성 검증
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELD = 'MISSING_FIELD',

  // 리소스
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // 외부 API
  OPENAI_ERROR = 'OPENAI_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 서버
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

---

## 속도 제한 및 성능

### 속도 제한 (Rate Limiting)

| 엔드포인트 | 제한 | 기간 |
|-----------|------|------|
| `/api/ai/chat` | 10 requests | 1분 |
| `/api/profile` (POST/PATCH) | 5 requests | 1분 |
| 나머지 엔드포인트 | 60 requests | 1분 |

**헤더**:
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1612345678
```

**초과 시**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.",
    "details": {
      "retry_after": 45
    }
  }
}
```

---

### 성능 목표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| API 응답 시간 | <200ms | Next.js Analytics |
| AI 대화 응답 시간 | <2s | OpenAI API Latency |
| 데이터베이스 쿼리 | <100ms | Supabase Dashboard |
| 페이지 로드 (SSR) | <1s | Lighthouse |

---

### 캐싱 전략

**Browser Caching**:
```http
# 정적 리소스 (이미지, CSS, JS)
Cache-Control: public, max-age=31536000, immutable

# API 응답 (프로필)
Cache-Control: private, max-age=300
```

**Supabase Caching**:
- RLS 정책으로 사용자별 격리
- Connection Pooling (최대 100 connections)

---

## 부록: TypeScript 타입 정의

**전체 타입 정의 파일**: `src/types/api.ts`

```typescript
// 프로필
export interface Profile {
  id: string;
  user_id: string;
  is_pregnant: boolean;
  due_date: string | null;
  pregnancy_week: number | null;
  is_working: boolean;
  region_province: string;
  region_city: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileRequest {
  is_pregnant: boolean;
  due_date?: string;
  is_working: boolean;
  region_province: string;
  region_city: string;
}

export interface UpdateProfileRequest {
  due_date?: string;
  is_working?: boolean;
  region_province?: string;
  region_city?: string;
}

// 자녀
export interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  age_months: number;
  created_at: string;
  updated_at: string;
}

export interface CreateChildRequest {
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
}

export interface UpdateChildRequest {
  name?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
}

// AI 대화
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  conversation_id: string;
  message: Message;
  context: {
    pregnancy_week?: number;
    age_months?: number;
    is_working: boolean;
    region: string;
  };
}

// 타임라인
export interface Timeline {
  id: string;
  user_id: string;
  child_id: string | null;
  event_type: string;
  event_category: string;
  description: string;
  scheduled_at: string;
  completed: boolean;
  notification_sent: boolean;
  notification_days: number[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateTimelineRequest {
  completed: boolean;
}

// 공통 응답
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

**문서 버전**: v1.0
**마지막 업데이트**: 2026-02-07
**다음 업데이트 예정**: Phase 4 Implementation 중 실제 구현 시 상세 수정
