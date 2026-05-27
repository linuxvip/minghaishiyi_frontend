import adminClient from './client';
import { PaginatedResponse, AuditLogEntry } from '../types/admin';

export const getAuditLogsApi = (params: {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}) =>
  adminClient.get<PaginatedResponse<AuditLogEntry>>('/admin-api/audit-logs/', { params });
