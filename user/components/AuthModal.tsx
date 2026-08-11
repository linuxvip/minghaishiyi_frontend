import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useToast } from '../../components/Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', onSuccess }) => {
  const { login, register } = useUserAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setError('');
    setPassword('');
    setPassword2('');
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    reset();
  };

  const handleClose = () => {
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const uname = username.trim();
    if (uname.length < 3) {
      setError('用户名至少 3 个字符');
      return;
    }
    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    if (mode === 'register' && password !== password2) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(uname, password);
        showToast('登录成功');
      } else {
        await register({
          username: uname,
          password,
          password2,
          nickname: nickname.trim(),
        });
        showToast('注册成功，欢迎加入命海拾遗');
      }
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      const detail = err?.response?.data;
      let msg = '操作失败，请稍后重试';
      if (detail) {
        if (typeof detail === 'string') msg = detail;
        else if (detail.detail) msg = detail.detail;
        else if (detail.username) msg = Array.isArray(detail.username) ? detail.username[0] : detail.username;
        else if (detail.password) msg = Array.isArray(detail.password) ? detail.password[0] : detail.password;
        else if (detail.password2) msg = Array.isArray(detail.password2) ? detail.password2[0] : detail.password2;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#fdfcf8] w-full max-w-md rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up border-t border-stone-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <div className="text-base font-bold text-[#2b2320]">{mode === 'login' ? '登录后继续' : '注册账号'}</div>
            <div className="text-[11px] text-stone-400 font-medium mt-0.5">
              {mode === 'login' ? '收藏命例、保存案例需要先登录' : '没有账号？注册后即可收藏命例、保存案例'}
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">昵称（可选）</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="如何称呼你"
                  className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#b39b7d] placeholder:text-stone-300"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="登录账号，至少 3 个字符"
                autoComplete="username"
                className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#b39b7d] placeholder:text-stone-300"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#b39b7d] placeholder:text-stone-300"
              />
            </div>

            {mode === 'register' && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">确认密码</label>
                <input
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                  className="w-full bg-stone-100 rounded-xl px-4 py-3 text-sm font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#b39b7d] placeholder:text-stone-300"
                />
              </div>
            )}

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#2b2320] text-white rounded-full text-base font-bold shadow-lg active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-1"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'login' ? '登录中...' : '注册中...'}
                </span>
              ) : (
                mode === 'login' ? '登 录' : '注 册'
              )}
            </button>

            <div className="text-center mt-3">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-xs font-bold text-[#b39b7d] hover:underline"
                >
                  还没有账号？立即注册
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-bold text-[#b39b7d] hover:underline"
                >
                  已有账号？直接登录
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AuthModal;
