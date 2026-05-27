import adminClient, { getAccessToken } from './client';
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

export const exportDestinyCasesCsv = async (params: Omit<DestinyCaseFilters, 'page' | 'page_size'>) => {
  const token = getAccessToken();
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) query.append(k, v);
  });
  const url = `/admin-api/destiny-cases/export-csv/?${query.toString()}`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error('导出失败');
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `\u547d\u6d77\u62fe\u9057-\u547d\u4f8b\u5e93-${timestamp}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
