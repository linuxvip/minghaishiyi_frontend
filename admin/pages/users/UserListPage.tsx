import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Loader2, Square, CheckSquare } from 'lucide-react';
import { getUsersApi, deleteUserApi } from '../../api/users';
import { AdminUser } from '../../types/admin';
import SearchInput from '../../components/SearchInput';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../../components/Toast';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const pagination = usePagination();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { data } = await getUsersApi({
        page: pagination.page,
        page_size: pagination.pageSize,
        search: search || undefined,
      });
      setUsers(data.results);
      pagination.setTotalCount(data.count);
    } catch {
      showToast('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    pagination.reset();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUserApi(deleteTarget.id);
      showToast('用户已删除');
      setDeleteTarget(null);
      fetchUsers();
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
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteUserApi(id)));
      showToast(`已删除 ${selectedIds.size} 个用户`);
      setSelectedIds(new Set());
      fetchUsers();
    } catch {
      showToast('部分删除失败，请刷新后重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-stone-800">用户管理</h1>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2b2320] text-white rounded-xl text-xs font-bold hover:bg-stone-700 transition-colors active:scale-95"
        >
          <Plus size={14} />
          新建用户
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <SearchInput value={search} onChange={handleSearchChange} placeholder="搜索用户名或邮箱..." />
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner /></div>
        ) : users.length === 0 ? (
          <EmptyState message="暂无匹配的用户" />
        ) : (
          <>
            {selectedIds.size > 0 && (
              <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">已选择 {selectedIds.size} 项</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1 text-[10px] font-bold text-stone-500 hover:text-stone-700 transition-colors">取消选择</button>
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
            {/* ─── 移动端卡片列表 ─── */}
            <div className="md:hidden divide-y divide-stone-100">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`px-4 py-3.5 ${selectedIds.has(u.id) ? 'bg-amber-50/40' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button onClick={() => toggleSelect(u.id)} className="text-stone-300 hover:text-amber-500 transition-colors flex-shrink-0">
                        {selectedIds.has(u.id) ? <CheckSquare size={16} className="text-amber-500" /> : <Square size={16} />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-700 truncate">{u.username}</p>
                        <p className="text-[11px] text-stone-400 truncate">{u.email || '无邮箱'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => navigate(`/admin/users/${u.id}`)} className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-9">
                    {u.is_superuser ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">超级管理员</span>
                    ) : u.is_staff ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">管理员</span>
                    ) : null}
                    <StatusBadge active={u.is_active} />
                  </div>
                </div>
              ))}
            </div>

            {/* ─── 桌面端表格 ─── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="text-left px-5 py-3 w-10">
                      <button onClick={toggleSelectAll} className="text-stone-300 hover:text-amber-500 transition-colors">
                        {selectedIds.size === users.length && users.length > 0 ? (
                          <CheckSquare size={15} className="text-amber-500" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold uppercase tracking-wider">ID</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold uppercase tracking-wider">用户名</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold uppercase tracking-wider hidden md:table-cell">邮箱</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold uppercase tracking-wider hidden md:table-cell">角色</th>
                    <th className="text-left px-5 py-3 text-stone-400 font-bold uppercase tracking-wider">状态</th>
                    <th className="text-right px-5 py-3 text-stone-400 font-bold uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={`border-b border-stone-50 hover:bg-stone-50/30 transition-colors ${selectedIds.has(u.id) ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleSelect(u.id)} className="text-stone-300 hover:text-amber-500 transition-colors">
                          {selectedIds.has(u.id) ? (
                            <CheckSquare size={15} className="text-amber-500" />
                          ) : (
                            <Square size={15} />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-stone-400 font-mono text-[11px]">{u.id}</td>
                      <td className="px-5 py-3 font-bold text-stone-700">{u.username}</td>
                      <td className="px-5 py-3 text-stone-500 hidden md:table-cell">{u.email || '-'}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {u.is_superuser ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">超级管理员</span>
                        ) : u.is_staff ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">管理员</span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">普通用户</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge active={u.is_active} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            aria-label={`编辑用户 ${u.username}`}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            aria-label={`删除用户 ${u.username}`}
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
        title="删除用户"
        message={`确定要删除用户「${deleteTarget?.username}」吗？此操作不可撤销。`}
        loading={deleting}
      />

      <ConfirmDialog
        isOpen={batchConfirmOpen}
        onClose={() => setBatchConfirmOpen(false)}
        onConfirm={handleBatchDelete}
        title="批量删除用户"
        message={`确定要删除选中的 ${selectedIds.size} 个用户吗？此操作不可撤销。`}
        loading={batchDeleting}
      />
    </div>
  );
};

export default UserListPage;
