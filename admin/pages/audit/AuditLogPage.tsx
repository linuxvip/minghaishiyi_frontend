import React, { useState, useEffect, useCallback } from 'react';
import { Clock, User, FileText, Search } from 'lucide-react';
import { getAuditLogsApi } from '../../api/audit-logs';
import { AuditLogEntry } from '../../types/admin';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../../components/Toast';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: '创建', color: 'bg-emerald-50 text-emerald-700' },
  UPDATE: { label: '修改', color: 'bg-amber-50 text-amber-700' },
  DELETE: { label: '删除', color: 'bg-rose-50 text-rose-700' },
};

const formatChanges = (changes: string): string => {
  try {
    const obj = JSON.parse(changes);
    if (Object.values(obj).every((v) => typeof v === 'string')) {
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
    }
    const lines: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
        const diff = v as { from: unknown; to: unknown };
        lines.push(`${k}: ${diff.from} → ${diff.to}`);
      } else {
        lines.push(`${k}: ${v}`);
      }
    }
    return lines.join('; ');
  } catch {
    return changes;
  }
};

const AuditLogPage: React.FC = () => {
  const { showToast } = useToast();
  const pagination = usePagination(20);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAuditLogsApi({
        page: pagination.page,
        page_size: pagination.pageSize,
        search: search || undefined,
      });
      setLogs(data.results);
      pagination.setTotalCount(data.count);
    } catch {
      showToast('加载操作日志失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    pagination.reset();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-stone-800 mb-6">操作日志</h1>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <SearchInput value={search} onChange={handleSearchChange} placeholder="搜索操作人、模型、变更内容..." />
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : logs.length === 0 ? (
          <EmptyState message="暂无操作日志" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-5 py-3 text-stone-400 font-bold w-40">时间</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold w-24">操作人</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold w-20">类型</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold w-28">对象</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold">变更内容</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-stone-50 hover:bg-stone-50/30 transition-colors">
                      <td className="px-5 py-3 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-stone-700">{log.user_name || '系统'}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${ACTION_LABELS[log.action]?.color || 'bg-stone-50 text-stone-500'}`}>
                          {ACTION_LABELS[log.action]?.label || log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-stone-400 font-mono text-[11px]">
                        {log.model_name}#{log.object_id}
                      </td>
                      <td className="px-5 py-3 text-stone-500 max-w-[300px] truncate" title={formatChanges(log.changes)}>
                        {formatChanges(log.changes) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-stone-100">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                pageSize={pagination.pageSize}
                onPageChange={pagination.setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
