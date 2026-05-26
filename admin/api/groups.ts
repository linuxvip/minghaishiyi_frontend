import adminClient from './client';
import { PaginatedResponse, AdminGroup, CreateGroupPayload } from '../types/admin';

export const getGroupsApi = (params: {
  page?: number;
  page_size?: number;
  search?: string;
}) =>
  adminClient.get<PaginatedResponse<AdminGroup>>('/admin-api/groups/', { params });

export const getGroupApi = (id: number) =>
  adminClient.get<AdminGroup>(`/admin-api/groups/${id}/`);

export const createGroupApi = (data: CreateGroupPayload) =>
  adminClient.post<AdminGroup>('/admin-api/groups/', data);

export const updateGroupApi = (id: number, data: Partial<CreateGroupPayload>) =>
  adminClient.patch<AdminGroup>(`/admin-api/groups/${id}/`, data);

export const deleteGroupApi = (id: number) =>
  adminClient.delete(`/admin-api/groups/${id}/`);
