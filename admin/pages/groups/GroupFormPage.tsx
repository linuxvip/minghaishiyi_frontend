import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { getGroupApi, createGroupApi, updateGroupApi } from '../../api/groups';
import { getFormErrorMessage } from '../../utils/errors';
import { useToast } from '../../../components/Toast';

const GroupFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState('');

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getGroupApi(Number(id))
        .then(({ data }) => {
          setName(data.name);
          setPermissions((data.permissions || []).join(', '));
        })
        .catch(() => showToast('加载用户组信息失败'))
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('请输入用户组名称');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const permIds = permissions
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const payload = { name: name.trim(), permissions: permIds };
      if (isEdit) {
        await updateGroupApi(Number(id), payload);
        showToast('用户组已更新');
      } else {
        await createGroupApi(payload);
        showToast('用户组已创建');
      }
      navigate('/admin/groups');
    } catch (err) {
      setFormError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-stone-300" size={28} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <button
        onClick={() => navigate('/admin/groups')}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="text-xs font-bold">返回用户组列表</span>
      </button>

      <h1 className="text-xl font-bold text-stone-800 mb-6">{isEdit ? '编辑用户组' : '新建用户组'}</h1>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="用户组名称"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              权限ID列表（逗号分隔）
            </label>
            <input
              type="text"
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="例: 1, 2, 3"
            />
            <p className="text-[10px] text-stone-400 mt-0.5">输入权限对应的数字ID，多个用逗号分隔</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2b2320] text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? '保存修改' : '创建用户组'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/groups')}
              className="px-6 py-2.5 bg-stone-100 text-stone-500 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupFormPage;
