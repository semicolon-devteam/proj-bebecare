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
  metadata: Record<string, unknown>;
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
    details?: unknown;
  };
}
