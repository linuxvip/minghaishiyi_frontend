import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useConfig } from '../contexts/ConfigContext';
import { useToast } from '../../components/Toast';
import { Loader2, AlertCircle } from 'lucide-react';

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data;
    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);
    if (data.non_field_errors) return ([] as string[]).concat(data.non_field_errors).join('；');
    const messages = Object.entries(data as Record<string, unknown>)
      .filter(([, v]) => v != null)
      .map(([, v]) => ([] as string[]).concat(v as never).join('、'));
    if (messages.length > 0) return messages.join('；');
  }
  return '登录失败，请检查用户名和密码';
};

const LoginPage: React.FC = () => {
  const config = useConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-stone-100">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-stone-200/50 blur-3xl" />
      </div>

      {/* 主卡片 */}
      <div className="relative w-full max-w-3xl flex rounded-[2.5rem] shadow-2xl shadow-stone-300/50 overflow-hidden">

        {/* ─── 左侧：品牌区 ─── */}
        <div className="hidden md:flex w-[45%] bg-[#2b2320] flex-col items-center justify-center px-8 py-12 relative overflow-hidden">
          {/* 装饰纹理 */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, #d4a574 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />

          {/* 太极图装饰 */}
          <svg className="absolute top-10 right-10 w-24 h-24 text-amber-700/15" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2" fill="currentColor" />
            <circle cx="50" cy="26" r="8" fill="#2b2320" />
            <circle cx="50" cy="74" r="8" fill="currentColor" />
          </svg>

          <div className="relative z-10 flex flex-col items-center">
            {/* 品牌图标 */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_24px_rgba(217,119,6,0.3)] animate-glow-pulse mb-6">
              <span className="text-white text-2xl font-bold font-calligraphy">命</span>
            </div>

            {/* 品牌名称 */}
            <h1 className="text-3xl font-calligraphy tracking-[0.15em] text-amber-100/90 mb-2">{config.site_name}</h1>

            {/* 分隔线 */}
            <div className="w-12 h-px bg-amber-700/40 my-3" />

            {/* 副标题 */}
            <p className="text-xs text-stone-400 tracking-[0.3em]">后台管理系统</p>
            <p className="text-[10px] text-stone-500 tracking-[0.2em] mt-2">MING HAI SHI YI</p>
          </div>
        </div>

        {/* ─── 右侧：表单区 ─── */}
        <div className="flex-1 bg-white px-8 py-12 sm:px-12">
          {/* 移动端品牌标识 */}
          <div className="md:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_16px_rgba(217,119,6,0.3)] mx-auto mb-3 animate-glow-pulse">
              <span className="text-white text-lg font-bold font-calligraphy">命</span>
            </div>
            <h1 className="text-xl font-calligraphy tracking-widest text-[#2b2320]">{config.site_name}</h1>
            <p className="text-[10px] text-stone-400 tracking-widest mt-1">后台管理系统</p>
          </div>

          <div className="md:hidden w-10 h-px bg-amber-200 mx-auto mb-6" />

          <h2 className="text-lg font-bold text-stone-800 mb-6">管理员登录</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 用户名 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>

            {/* 密码 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-bold tracking-widest hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:shadow-amber-200 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-stone-300 tracking-[0.2em] mt-8">
            MING HAI SHI YI · ADMIN
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
