import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Trash2, Square, CheckSquare, Play, ExternalLink } from 'lucide-react';
import {
  getProcessingTasksApi,
  createProcessingTaskApi,
  processTaskApi,
  deleteProcessingTaskApi,
} from '../../api/processing-tasks';
import { ProcessingTask, ProcessingTaskFilters } from '../../types/admin';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import SearchInput from '../../components/SearchInput';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../../components/Toast';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-stone-100 text-stone-600' },
  processing: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  done: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: '失败', className: 'bg-rose-100 text-rose-700' },
};

const ProcessingTaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const pagination = usePagination();
  const [tasks, setTasks] = useState<ProcessingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ProcessingTask | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ urls: '', source_name: '' });
  const [creating, setCreating] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const buildParams = useCallback((): ProcessingTaskFilters => {
    const p: ProcessingTaskFilters = {
      page: pagination.page,
      page_size: pagination.pageSize,
    };
    if (search) p.search = search;
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [pagination.page, pagination.pageSize, search, statusFilter]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    setExpandedIds(new Set());
    try {
      const { data } = await getProcessingTasksApi(buildParams());
      setTasks(data.results);
      pagination.setTotalCount(data.count);
    } catch {
      showToast('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  }, [buildParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = tasks.some(t => t.status === 'processing');
      if (hasProcessing) {
        fetchTasks();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks, fetchTasks]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map(c => c.id)));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.urls.trim() || !createForm.source_name.trim()) return;
    setCreating(true);
    try {
      await createProcessingTaskApi({ url: createForm.urls.trim(), source_name: createForm.source_name.trim() });
      showToast('任务已创建');
      setShowCreateModal(false);
      setCreateForm({ urls: '', source_name: '' });
      fetchTasks();
    } catch {
      showToast('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleProcess = async (id: number) => {
    try {
      await processTaskApi(id);
      showToast('任务已开始处理');
      navigate(`/admin/processing-tasks/${id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || '启动失败';
      showToast(msg);
    }
  };

  const handleBatchProcess = async () => {
    if (selectedIds.size === 0) return;
    setBatchProcessing(true);
    let count = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        await processTaskApi(id);
        count++;
      } catch { /* skip failed */ }
    }
    setBatchProcessing(false);
    showToast(`已启动 ${count} 个任务`);
    setSelectedIds(new Set());
    fetchTasks();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProcessingTaskApi(deleteTarget.id);
      showToast('任务已删除');
      setDeleteTarget(null);
      fetchTasks();
    } catch {
      showToast('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const truncateUrl = (url: string, max = 60) => {
    return url.length > max ? url.slice(0, max) + '...' : url;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-800">案例收集</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2b2320] text-white rounded-xl text-xs font-bold hover:bg-stone-700 transition-colors active:scale-95"
        >
          <Plus size={14} />
          新建任务
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
        {/* 搜索和筛选 */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); pagination.reset(); }}
              placeholder="搜索链接或来源..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); pagination.reset(); }}
            className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-200"
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="done">已完成</option>
            <option value="failed">失败</option>
          </select>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchProcess}
              disabled={batchProcessing}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors active:scale-95 disabled:opacity-60"
            >
              <Play size={12} />
              {batchProcessing ? '启动中...' : `批量处理 (${selectedIds.size})`}
            </button>
          )}
        </div>

        {/* 内容区域 */}
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : tasks.length === 0 ? (
          <div className="py-20"><EmptyState message="暂无处理任务" /></div>
        ) : (
          <>
            {/* 移动端卡片 */}
            <div className="md:hidden divide-y divide-stone-50">
              {tasks.map((t) => (
                <div key={t.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSelect(t.id)} className="text-stone-300 hover:text-amber-500 transition-colors">
                        {selectedIds.has(t.id) ? <CheckSquare size={15} className="text-amber-500" /> : <Square size={15} />}
                      </button>
                      <span className="text-[10px] text-stone-400 font-mono">#{t.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CONFIG[t.status]?.className || ''}`}>
                        {STATUS_CONFIG[t.status]?.label || t.status}
                      </span>
                    </div>
                    <ChevronDown size={14} className={`text-stone-300 transition-transform cursor-pointer ${expandedIds.has(t.id) ? 'rotate-180' : ''}`} onClick={(e) => toggleExpand(t.id, e)} />
                  </div>
                  <p className="text-xs text-stone-600 mb-1 truncate" title={t.url}>{truncateUrl(t.url, 50)}</p>
                  <div className="flex items-center gap-3 text-[10px] text-stone-400">
                    <span>来源: {t.source_name}</span>
                    {t.cases_created > 0 && <span>入库: {t.cases_created}</span>}
                  </div>
                  {expandedIds.has(t.id) && (
                    <div className="mt-3 pt-3 border-t border-stone-50 flex items-center gap-2">
                      {(t.status === 'pending' || t.status === 'failed') && (
                        <button onClick={() => handleProcess(t.id)} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold hover:bg-amber-600 transition-colors">
                          <Play size={10} /> 开始处理
                        </button>
                      )}
                      <button onClick={() => navigate(`/admin/processing-tasks/${t.id}`)} className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-bold hover:bg-stone-200 transition-colors">
                        <ExternalLink size={10} /> 查看详情
                      </button>
                      {t.status !== 'processing' && (
                        <button onClick={() => setDeleteTarget(t)} className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 text-rose-500 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors">
                          <Trash2 size={10} /> 删除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 桌面端表格 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-4 py-3 w-10">
                      <button onClick={toggleSelectAll} className="text-stone-300 hover:text-amber-500 transition-colors">
                        {selectedIds.size === tasks.length && tasks.length > 0 ? (
                          <CheckSquare size={15} className="text-amber-500" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">ID</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">文章链接</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">来源标签</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">状态</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">入库数</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden lg:table-cell">提交时间</th>
                    <th className="text-right px-4 py-3 text-stone-400 font-bold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-stone-50 hover:bg-stone-50/30 transition-colors ${selectedIds.has(t.id) ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(t.id)} className="text-stone-300 hover:text-amber-500 transition-colors">
                          {selectedIds.has(t.id) ? <CheckSquare size={15} className="text-amber-500" /> : <Square size={15} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-stone-400 font-mono text-[11px]">{t.id}</td>
                      <td className="px-4 py-3 text-stone-600 max-w-[220px] truncate" title={t.url}>
                        {truncateUrl(t.url)}
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-700">{t.source_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_CONFIG[t.status]?.className || ''} ${t.status === 'processing' ? 'animate-pulse' : ''}`}>
                          {STATUS_CONFIG[t.status]?.label || t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{t.cases_created}</td>
                      <td className="px-4 py-3 text-stone-400 hidden lg:table-cell text-[11px]">
                        {new Date(t.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(t.status === 'pending' || t.status === 'failed') && (
                            <button onClick={() => handleProcess(t.id)} className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="开始处理">
                              <Play size={14} />
                            </button>
                          )}
                          <button onClick={() => navigate(`/admin/processing-tasks/${t.id}`)} className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="查看详情">
                            <ExternalLink size={14} />
                          </button>
                          {t.status !== 'processing' && (
                            <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="删除">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
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

      {/* 创建任务弹窗 */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新建处理任务" size="md">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-400">微信文章链接 *</label>
            <textarea
              value={createForm.urls}
              onChange={(e) => setCreateForm({ ...createForm, urls: e.target.value })}
              placeholder="https://mp.weixin.qq.com/s/...&#10;每行一个链接"
              rows={6}
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-700 outline-none focus:ring-1 focus:ring-amber-200 resize-y"
              required
              autoFocus
            />
            <span className="text-[9px] text-stone-400">
              {createForm.urls.trim() ? `${createForm.urls.split('\n').filter(s => s.trim()).length} 个链接` : '每行一个链接'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-stone-400">来源标签 *</label>
            <input
              type="text"
              value={createForm.source_name}
              onChange={(e) => setCreateForm({ ...createForm, source_name: e.target.value })}
              placeholder="如：铁口擂台"
              className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs text-stone-700 outline-none focus:ring-1 focus:ring-amber-200"
              required
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors">
              取消
            </button>
            <button type="submit" disabled={creating} className="flex-1 py-2.5 bg-[#2b2320] text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors disabled:opacity-60">
              {creating ? '创建中...' : '确认创建'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除任务"
        message={`确定要删除任务「${deleteTarget?.source_name || ''} - ID:${deleteTarget?.id || ''}」吗？`}
        loading={deleting}
      />
    </div>
  );
};

export default ProcessingTaskListPage;
