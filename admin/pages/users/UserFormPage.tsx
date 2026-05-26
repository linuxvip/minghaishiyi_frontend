import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { getUserApi, createUserApi, updateUserApi, setPasswordApi } from '../../api/users';
import { getGroupsApi } from '../../api/groups';
import { AdminGroup } from '../../types/admin';
import { getFormErrorMessage } from '../../utils/errors';
import { useToast } from '../../../components/Toast';

const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<AdminGroup[]>([]);

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    groups: [] as number[],
  });

  const [formError, setFormError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', show: false, error: '' });
  const [settingPassword, setSettingPassword] = useState(false);

  useEffect(() => {
    getGroupsApi({ page_size: 200 }).then(({ data }) => setGroups(data.results)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getUserApi(Number(id))
        .then(({ data }) => {
          setForm({
            username: data.username,
            email: data.email || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            password: '',
            is_active: data.is_active,
            is_staff: data.is_staff,
            is_superuser: data.is_superuser,
            groups: data.groups || [],
          });
        })
        .catch(() => showToast('加载用户信息失败'))
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) {
      showToast('请输入用户名');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: !isEdit && form.password ? form.password : undefined,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        is_active: form.is_active,
        is_staff: form.is_staff,
        is_superuser: form.is_superuser,
        groups: form.groups,
      };
      if (isEdit) {
        await updateUserApi(Number(id), payload);
        showToast('用户已更新');
      } else {
        if (!form.password) {
          showToast('请输入密码');
          setSaving(false);
          return;
        }
        await createUserApi(payload);
        showToast('用户已创建');
      }
      navigate('/admin/users');
    } catch (err) {
      setFormError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      setPasswordForm({ ...passwordForm, error: '密码至少8个字符' });
      return;
    }
    setSettingPassword(true);
    setPasswordForm({ ...passwordForm, error: '' });
    try {
      await setPasswordApi(Number(id), passwordForm.newPassword);
      showToast('密码已更新');
      setPasswordForm({ newPassword: '', show: false, error: '' });
    } catch (err) {
      setPasswordForm({ ...passwordForm, error: getFormErrorMessage(err) });
    } finally {
      setSettingPassword(false);
    }
  };

  const toggleGroup = (groupId: number) => {
    setForm((prev) => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter((g) => g !== groupId)
        : [...prev.groups, groupId],
    }));
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
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="text-xs font-bold">返回用户列表</span>
      </button>

      <h1 className="text-xl font-bold text-stone-800 mb-6">{isEdit ? '编辑用户' : '新建用户'}</h1>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">用户名 *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">名字</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">姓氏</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">密码 *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="至少8个字符"
              />
            </div>
          )}

          <div className="border-t border-stone-100 pt-4">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">权限设置</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500">状态</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-stone-300'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <span className="text-xs font-bold text-stone-500">{form.is_active ? '启用' : '禁用'}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_staff}
                  onChange={(e) => setForm({ ...form, is_staff: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-200"
                />
                <span className="text-sm text-stone-600">管理员</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_superuser}
                  onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-200"
                />
                <span className="text-sm text-stone-600">超级管理员</span>
              </label>
            </div>
          </div>

          {groups.length > 0 && (
            <div className="border-t border-stone-100 pt-4">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">所属用户组</p>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      form.groups.includes(g.id)
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-stone-50 text-stone-400 border border-stone-100 hover:border-stone-200'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2b2320] text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? '保存修改' : '创建用户'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-6 py-2.5 bg-stone-100 text-stone-500 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-sm font-bold text-stone-700 mb-3">修改密码</p>
            {passwordForm.error && (
              <p className="text-xs text-rose-600 font-bold mb-2">{passwordForm.error}</p>
            )}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <input
                  type={passwordForm.show ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value, error: '' })}
                  placeholder="新密码（至少8位）"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-4 pr-10 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm({ ...passwordForm, show: !passwordForm.show })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
                >
                  {passwordForm.show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                onClick={handleSetPassword}
                disabled={settingPassword}
                className="px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-200 transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                {settingPassword && <Loader2 size={12} className="animate-spin" />}
                设置密码
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFormPage;
