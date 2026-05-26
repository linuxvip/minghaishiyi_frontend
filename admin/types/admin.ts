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
