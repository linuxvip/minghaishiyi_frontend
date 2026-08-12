export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  groups: number[];
}

export interface AdminGroup {
  id: number;
  name: string;
  permissions: number[];
  user_set: number[];
}

export interface AdminDestinyCase {
  id: number;
  source: string;
  gender: number; // 1=男, 0=女
  year_ganzhi: string;
  month_ganzhi: string;
  day_ganzhi: string;
  hour_ganzhi: string;
  feedback: string | null;
  original_url: string | null;
  label: string | null;
  created_time: string;
  updated_time: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface CreateUserPayload {
  username: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  groups?: number[];
}

export interface CreateGroupPayload {
  name: string;
  permissions?: number[];
}

export interface AuditLogEntry {
  id: number;
  user: number | null;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  model_name: string;
  object_id: number;
  changes: string;
  timestamp: string;
}

export interface SystemConfigMap { site_name: string; site_subtitle: string; footer_text: string; qrcode_url: string; avatar_url: string; wx_qrcode_url: string; deepseek_api_key: string; deepseek_api_url: string; [key: string]: string; }

// ==================== 文章管理 ====================

export interface Article {
  id: number;
  title: string;
  url: string;
  cover_url: string;
  summary: string;
  category: string;
  source: string;
  tags: string;
  sort_order: number;
  is_published: boolean;
  published_time: string | null;
  created_time: string;
  updated_time: string;
}

export interface CreateArticlePayload {
  title: string;
  url: string;
  cover_url?: string;
  summary?: string;
  category?: string;
  source?: string;
  tags?: string;
  sort_order?: number;
  is_published?: boolean;
}

export interface CreateDestinyCasePayload {
  source: string;
  gender: number;
  year_ganzhi: string;
  month_ganzhi: string;
  day_ganzhi: string;
  hour_ganzhi: string;
  feedback?: string;
  original_url?: string;
  label?: string;
}

export interface ProcessingTask {
  id: number;
  url: string;
  source_name: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  log: string;
  cases_created: number;
  error_message: string;
  created_at: string;
  updated_at: string;
  status_display: string;
}

export interface CreateProcessingTaskPayload {
  url: string;
  source_name: string;
}

export interface ProcessingTaskFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
}
