import adminClient from './client';
import { PaginatedResponse, AdminDestinyCase, CreateDestinyCasePayload } from '../types/admin';

export interface DestinyCaseFilters {
  page?: number;
  page_size?: number;
  gender?: string;
  source?: string;
  year_ganzhi?: string;
  month_ganzhi?: string;
  day_ganzhi?: string;
  hour_ganzhi?: string;
  label?: string;
  search?: string;
  ordering?: string;
}

export const getDestinyCasesApi = (params: DestinyCaseFilters) =>
  adminClient.get<PaginatedResponse<AdminDestinyCase>>('/admin-api/destiny-cases/', { params });

export const getDestinyCaseApi = (id: number) =>
  adminClient.get<AdminDestinyCase>(`/admin-api/destiny-cases/${id}/`);

export const createDestinyCaseApi = (data: CreateDestinyCasePayload) =>
  adminClient.post<AdminDestinyCase>('/admin-api/destiny-cases/', data);

export const updateDestinyCaseApi = (id: number, data: Partial<CreateDestinyCasePayload>) =>
  adminClient.patch<AdminDestinyCase>(`/admin-api/destiny-cases/${id}/`, data);

export const deleteDestinyCaseApi = (id: number) =>
  adminClient.delete(`/admin-api/destiny-cases/${id}/`);

export const getDestinyCaseSourcesApi = () =>
  adminClient.get<{ sources: string[] }>('/api/destiny-cases/sources/');
