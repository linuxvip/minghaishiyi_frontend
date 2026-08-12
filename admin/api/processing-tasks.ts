import adminClient from './client';
import {
  PaginatedResponse,
  ProcessingTask,
  CreateProcessingTaskPayload,
  ProcessingTaskFilters,
} from '../types/admin';

export const getProcessingTasksApi = (params: ProcessingTaskFilters) =>
  adminClient.get<PaginatedResponse<ProcessingTask>>('/admin-api/tasks/', { params });

export const createProcessingTaskApi = (data: CreateProcessingTaskPayload) =>
  adminClient.post<ProcessingTask>('/admin-api/tasks/', data);

export const getProcessingTaskApi = (id: number) =>
  adminClient.get<ProcessingTask>(`/admin-api/tasks/${id}/`);

export const processTaskApi = (id: number) =>
  adminClient.post<{ detail: string }>(`/admin-api/tasks/${id}/process/`);

export const deleteProcessingTaskApi = (id: number) =>
  adminClient.delete(`/admin-api/tasks/${id}/`);
