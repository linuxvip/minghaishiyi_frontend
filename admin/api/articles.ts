import adminClient from './client';
import { PaginatedResponse, Article, CreateArticlePayload } from '../types/admin';

export interface ArticleFilters {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_published?: string;
}

export const getArticlesApi = (params: ArticleFilters) =>
  adminClient.get<PaginatedResponse<Article>>('/admin-api/articles/', { params });

export const getArticleApi = (id: number) =>
  adminClient.get<Article>(`/admin-api/articles/${id}/`);

export const createArticleApi = (data: CreateArticlePayload) =>
  adminClient.post<Article>('/admin-api/articles/', data);

export const updateArticleApi = (id: number, data: Partial<CreateArticlePayload>) =>
  adminClient.patch<Article>(`/admin-api/articles/${id}/`, data);

export const deleteArticleApi = (id: number) =>
  adminClient.delete(`/admin-api/articles/${id}/`);
