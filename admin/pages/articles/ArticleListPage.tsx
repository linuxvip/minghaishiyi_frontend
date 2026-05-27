import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Search, X, ExternalLink } from 'lucide-react';
import { getArticlesApi, deleteArticleApi, ArticleFilters } from '../../api/articles';
import { Article } from '../../types/admin';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../../components/Toast';

const ArticleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const pagination = usePagination();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const buildParams = useCallback((): ArticleFilters => {
    const p: ArticleFilters = {
      page: pagination.page,
      page_size: pagination.pageSize,
    };
    if (search) p.search = search;
    return p;
  }, [pagination.page, pagination.pageSize, search]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getArticlesApi(buildParams());
      setArticles(data.results);
      pagination.setTotalCount(data.count);
    } catch {
      showToast('加载文章列表失败');
    } finally {
      setLoading(false);
    }
  }, [buildParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArticleApi(deleteTarget.id);
      showToast('文章已删除');
      setDeleteTarget(null);
      fetchArticles();
    } catch {
      showToast('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pagination.reset();
    fetchArticles();
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-800">文章管理</h1>
        <button
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2b2320] text-white rounded-xl text-xs font-bold hover:bg-stone-700 transition-colors active:scale-95"
        >
          <Plus size={14} />
          新建文章
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题、分类、来源..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors"
          >
            搜索
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); pagination.reset(); }}
              className="p-2 text-stone-300 hover:text-rose-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : articles.length === 0 ? (
          <EmptyState message="暂无文章" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-4 py-3 text-stone-400 font-bold w-12">ID</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold">标题</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden md:table-cell">分类</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden lg:table-cell">来源</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden sm:table-cell">状态</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden lg:table-cell">排序</th>
                    <th className="text-left px-4 py-3 text-stone-400 font-bold hidden xl:table-cell">更新时间</th>
                    <th className="text-right px-4 py-3 text-stone-400 font-bold w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/admin/articles/${a.id}`)}
                      className="border-b border-stone-50 hover:bg-stone-50/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-stone-400 font-mono text-[11px]">{a.id}</td>
                      <td className="px-4 py-3 font-bold text-stone-700 max-w-[240px] truncate" title={a.title}>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{a.title}</span>
                          {a.url && (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-amber-500 hover:text-amber-700 flex-shrink-0"
                            >
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {a.category ? (
                          <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold">{a.category}</span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-stone-500 max-w-[120px] truncate" title={a.source}>
                        {a.source || '-'}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${a.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                          {a.is_published ? '显示' : '隐藏'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-stone-500 font-mono">{a.sort_order}</td>
                      <td className="px-4 py-3 hidden xl:table-cell text-stone-400 text-[10px]">{formatTime(a.updated_time)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/articles/${a.id}`); }} className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(a); }} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
        title="删除文章"
        message={`确定要删除文章「${deleteTarget?.title}」吗？此操作不可撤销。`}
        loading={deleting}
      />
    </div>
  );
};

export default ArticleListPage;
