export type FavoriteObjectType = 'destiny_case' | 'article' | 'user_case';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  preferences: Record<string, unknown>;
  created_time: string;
}

export interface UserCaseRecord {
  id: number;
  gender: number;
  year_ganzhi: string;
  month_ganzhi: string;
  day_ganzhi: string;
  hour_ganzhi: string;
  subject_name: string;
  notes: string;
  input_snapshot: Record<string, unknown>;
  created_time: string;
  updated_time: string;
}

export interface DestinyCaseSummary {
  kind: 'destiny_case';
  id: number;
  source: string;
  gender: number;
  year_ganzhi: string;
  month_ganzhi: string;
  day_ganzhi: string;
  hour_ganzhi: string;
  feedback: string;
}

export interface ArticleSummary {
  kind: 'article';
  id: number;
  title: string;
  url: string;
  cover_url: string;
  summary: string;
  source: string;
  category: string;
}

export interface UserCaseSummary {
  kind: 'user_case';
  id: number;
  gender: number;
  year_ganzhi: string;
  month_ganzhi: string;
  day_ganzhi: string;
  hour_ganzhi: string;
  subject_name: string;
  notes: string;
}

export type FavoriteSummary = DestinyCaseSummary | ArticleSummary | UserCaseSummary;

export interface FavoriteRecord {
  id: number;
  object_id: number;
  object_summary: FavoriteSummary | null;
  created_time: string;
}
