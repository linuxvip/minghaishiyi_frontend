import adminClient from './client';
import { PaginatedResponse, AdminUser, CreateUserPayload } from '../types/admin';

export const getUsersApi = (params: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}) =>
  adminClient.get<PaginatedResponse<AdminUser>>('/admin-api/users/', { params });

export const getUserApi = (id: number) =>
  adminClient.get<AdminUser>(`/admin-api/users/${id}/`);

export const createUserApi = (data: CreateUserPayload) =>
  adminClient.post<AdminUser>('/admin-api/users/', data);

export const updateUserApi = (id: number, data: Partial<CreateUserPayload>) =>
  adminClient.patch<AdminUser>(`/admin-api/users/${id}/`, data);

export const deleteUserApi = (id: number) =>
  adminClient.delete(`/admin-api/users/${id}/`);

export const setPasswordApi = (id: number, password: string) =>
  adminClient.post(`/admin-api/users/${id}/set-password/`, { password });
