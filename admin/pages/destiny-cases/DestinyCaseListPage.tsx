import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, X, Square, CheckSquare } from 'lucide-react';
import { getDestinyCasesApi, deleteDestinyCaseApi, getDestinyCaseSourcesApi, DestinyCaseFilters } from '../../api/destiny-cases';
import { AdminDestinyCase } from '../../types/admin';
import { ELEMENT_COLORS, STEM_ELEMENTS, BRANCH_ELEMENTS } from '../../../constants';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../../components/Toast';

const MiniPillar: React.FC<{ gan: string; zhi: string }> = ({ gan, zhi }) => {
  const ganElem = STEM_ELEMENTS[gan] || '';
  const zhiElem = BRANCH_ELEMENTS[zhi] || '';
  const ganCol = ELEMENT_COLORS[ganElem] || ELEMENT_COLORS.default;
  const zhiCol = ELEMENT_COLORS[zhiElem] || ELEMENT_COLORS.default;

  return (
    <div className="flex flex-col gap-0.5 items-center">
      <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-md border text-xs md:text-sm font-bold ${ganCol.bg} ${ganCol.border} ${ganCol.text}`}>
        {gan || '?'}
      </div>
      <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-md border text-xs md:text-sm font-bold ${zhiCol.bg} ${zhiCol.border} ${zhiCol.text}`}>
        {zhi || '?'}
      </div>
    </div>
  );
};

const LABEL_KEYS = ['出身', '学历', '职业类别', '职业细分', '婚姻状态', '财富层次'];

const parseLabelTags = (label: string | null): string[] => {
  if (!label) return [];
  try {
    const obj = JSON.parse(label);
    return LABEL_KEYS.map((k) => obj[k]).filter((v) => v !== undefined && v !== null && v !== '' && v !== 0);
  } catch {
    return String(label).split(/[，,]/).filter(Boolean);
  }
};

const DestinyCaseListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const pagination = usePagination();
  const [cases, setCases] = useState<AdminDestinyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminDestinyCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState({
    gender: '',
    source: '',
    label: '',
    year_ganzhi: '',
    month_ganzhi: '',
    day_ganzhi: '',
    hour_ganzhi: '',
    search: '',
  });

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const buildParams = useCallback((): DestinyCaseFilters => {
    const p: DestinyCaseFilters = {
      page: pagination.page,
      page_size: pagination.pageSize,
    };
    if (filters.gender) p.gender = filters.gender;
    if (filters.source) p.source = filters.source;
    if (filters.label) p.label = filters.label;
    if (filters.year_ganzhi) p.year_ganzhi = filters.year_ganzhi;
    if (filters.month_ganzhi) p.month_ganzhi = filters.month_ganzhi;
    if (filters.day_ganzhi) p.day_ganzhi = filters.day_ganzhi;
    if (filters.hour_ganzhi) p.hour_ganzhi = filters.hour_ganzhi;
    if (filters.search) p.search = filters.search;
    return p;
  }, [pagination.page, pagination.pageSize, filters]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { data } = await getDestinyCasesApi(buildParams());
      setCases(data.results);
      pagination.setTotalCount(data.count);
    } catch {
      showToast('加载命例列表失败');
    } finally {
      setLoading(false);
    }
  }, [buildParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    getDestinyCaseSourcesApi()
      .then(({ data }) => setSourceOptions(data.sources))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDestinyCaseApi(deleteTarget.id);
      showToast('命例已删除');
      setDeleteTarget(null);
      fetchCases();
    } catch {
      showToast('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cases.map((c) => c.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteDestinyCaseApi(id)));
      showToast(`已删除 ${selectedIds.size} 条命例`);
      setSelectedIds(new Set());
      fetchCases();
    } catch {
      showToast('部分删除失败，请刷新后重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  const resetFilters = () => {
    setFilters({ gender: '', source: '', label: '', year_ganzhi: '', month_ganzhi: '', day_ganzhi: '', hour_ganzhi: '', search: '' });
    pagination.reset();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-800">命例管理</h1>
        <button
          onClick={() => navigate('/admin/destiny-cases/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2b2320] text-white rounded-xl text-xs font-bold hover:bg-stone-700 transition-colors active:scale-95"
        >
          <Plus size={14} />
          新建命例
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400">性别</label>
              <select
                value={filters.gender}
                onChange={(e) => { setFilters({ ...filters, gender: e.target.value }); pagination.reset(); }}
                className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-200"
              >
                <option value="">全部</option>
                <option value="1">男</option>
                <option value="0">女</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400">来源</label>
              <select
                value={filters.source}
                onChange={(e) => { setFilters({ ...filters, source: e.target.value }); pagination.reset(); }}
                className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-200"
              >
                <option value="">全部来源</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400">标签</label>
              <input
                type="text"
                value={filters.label}
                onChange={(e) => { setFilters({ ...filters, label: e.target.value }); pagination.reset(); }}
                placeholder="关键词"
                className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400">全文搜索</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); pagination.reset(); }}
                placeholder="搜索..."
                className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
            {['year_ganzhi', 'month_ganzhi', 'day_ganzhi', 'hour_ganzhi'].map((key, idx) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400">{['年柱', '月柱', '日柱', '时柱'][idx]}</label>
                <input
                  type="text"
                  value={(filters as Record<string, string>)[key]}
                  onChange={(e) => { setFilters({ ...filters, [key]: e.target.value }); pagination.reset(); }}
                  placeholder="例: 甲子"
                  className="bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-amber-200 placeholder:text-stone-300"
                />
              </div>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors"
            >
              <X size={12} />
              清除所有筛选
            </button>
          )}
        </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : cases.length === 0 ? (
          <EmptyState message="暂无匹配的命例" />
        ) : (
          <>
            {/* 批量操作栏 */}
            {selectedIds.size > 0 && (
              <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">已选择 {selectedIds.size} 项</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="px-3 py-1 text-[10px] font-bold text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    取消选择
                  </button>
                  <button
                    onClick={() => setBatchConfirmOpen(true)}
                    disabled={batchDeleting}
                    className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-bold hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    批量删除
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-4 py-3 w-10">
                      <button onClick={toggleSelectAll} className="text-stone-300 hover:text-amber-500 transition-colors">
                        {selectedIds.size === cases.length && cases.length > 0 ? (
                          <CheckSquare size={15} className="text-amber-500" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">ID</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">来源</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">性别</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden md:table-cell">四柱</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden lg:table-cell">标签</th>
                    <th className="text-right px-4 py-3 text-stone-400 font-bold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} className={`border-b border-stone-50 hover:bg-stone-50/30 transition-colors ${selectedIds.has(c.id) ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(c.id)} className="text-stone-300 hover:text-amber-500 transition-colors">
                          {selectedIds.has(c.id) ? (
                            <CheckSquare size={15} className="text-amber-500" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-stone-400 font-mono text-[11px]">{c.id}</td>
                      <td className="px-4 py-3 font-bold text-stone-700 max-w-[120px] truncate" title={c.source}>{c.source}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.gender === 1 ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>
                          {c.gender === 1 ? '男' : '女'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex gap-2">
                          <MiniPillar gan={c.year_ganzhi[0]} zhi={c.year_ganzhi[1]} />
                          <MiniPillar gan={c.month_ganzhi[0]} zhi={c.month_ganzhi[1]} />
                          <MiniPillar gan={c.day_ganzhi[0]} zhi={c.day_ganzhi[1]} />
                          <MiniPillar gan={c.hour_ganzhi[0]} zhi={c.hour_ganzhi[1]} />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {parseLabelTags(c.label).slice(0, 3).map((t, i) => (
                            <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/destiny-cases/${c.id}`)}
                            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            aria-label={`编辑命例 ${c.id}`}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            aria-label={`删除命例 ${c.id}`}
                          >
                            <Trash2 size={14} />
                          </button>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除命例"
        message={`确定要删除此命例「${deleteTarget?.source} - ID:${deleteTarget?.id}」吗？此操作不可撤销。`}
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={batchConfirmOpen}
        onClose={() => setBatchConfirmOpen(false)}
        onConfirm={handleBatchDelete}
        title="批量删除命例"
        message={`确定要删除选中的 ${selectedIds.size} 条命例吗？此操作不可撤销。`}
        loading={batchDeleting}
      />
    </div>
  );
};

export default DestinyCaseListPage;
