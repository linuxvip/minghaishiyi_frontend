import React, { useState, useEffect, useCallback } from 'react';
import {
  User as UserIcon,
  LogOut,
  Trash2,
  ChevronRight,
  Loader2,
  Heart,
  BookOpen,
  LayoutGrid,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import AuthModal from './AuthModal';
import {
  listUserCasesApi,
  deleteUserCaseApi,
  listFavoritesApi,
  toggleFavoriteApi,
} from '../api/userApi';
import {
  UserCaseRecord,
  FavoriteRecord,
  FavoriteSummary,
} from '../types';
import { Gender } from '../../types';
import AuthorInfo from '../../components/AuthorInfo';
import { useToast } from '../../components/Toast';
import ConfirmModal from './ConfirmModal';
import SettingsPanel from './SettingsPanel';

type SubTab = 'CASES' | 'FAVORITES' | 'SETTINGS' | 'ABOUT';

interface ProfilePageProps {
  onCalculate: (data: any) => Promise<boolean>;
}

const genderNumToEnum = (g: number): Gender => (g === 1 ? Gender.MALE : Gender.FEMALE);

const pillarSummary = (u: { year_ganzhi: string; month_ganzhi: string; day_ganzhi: string; hour_ganzhi: string }): string =>
  `${u.year_ganzhi} ${u.month_ganzhi} ${u.day_ganzhi} ${u.hour_ganzhi}`;

const favoriteTitle = (s: FavoriteSummary): string => {
  if (s.kind === 'article') return s.title;
  if (s.kind === 'user_case') return s.subject_name || '未命名案例';
  return s.source || '命例库';
};

const ProfilePage: React.FC<ProfilePageProps> = ({ onCalculate }) => {
  const { user, isAuthenticated, isLoading, logout } = useUserAuth();
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>('CASES');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [cases, setCases] = useState<UserCaseRecord[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRecord[] | null>(null);
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserCaseRecord | null>(null);
  const [unfavTarget, setUnfavTarget] = useState<{ id: number; summary: FavoriteSummary } | null>(null);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const refreshCases = useCallback(async () => {
    try {
      setCases(await listUserCasesApi());
    } catch {
      setCases([]);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    try {
      setFavorites(await listFavoritesApi());
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCases();
      refreshFavorites();
    } else {
      setCases(null);
      setFavorites(null);
    }
  }, [isAuthenticated, refreshCases, refreshFavorites]);

  const handleCalcFromGanzhi = useCallback((g: number, gz: { year_ganzhi: string; month_ganzhi: string; day_ganzhi: string; hour_ganzhi: string }, extra?: Record<string, unknown>) => {
    onCalculate({
      gender: genderNumToEnum(g),
      type: 'DIRECT',
      directData: {
        yearGan: gz.year_ganzhi[0], yearZhi: gz.year_ganzhi[1],
        monthGan: gz.month_ganzhi[0], monthZhi: gz.month_ganzhi[1],
        dayGan: gz.day_ganzhi[0], dayZhi: gz.day_ganzhi[1],
        hourGan: gz.hour_ganzhi[0], hourZhi: gz.hour_ganzhi[1],
      },
      ...extra,
    });
  }, [onCalculate]);

  const handleDeleteCase = async (id: number) => {
    try {
      await deleteUserCaseApi(id);
      setCases((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
      showToast('已删除该案例');
    } catch {
      showToast('删除失败，请稍后重试');
    }
  };

  const handleUnfavorite = async (favId: number, summary: FavoriteSummary) => {
    const kind = summary.kind === 'destiny_case' ? 'destiny_case' : summary.kind === 'article' ? 'article' : 'user_case';
    const prev = favorites;
    // 乐观更新：立即移除并提示，失败回滚
    setFavorites((p) => (p ? p.filter((f) => f.id !== favId) : p));
    showToast('已取消收藏');
    try {
      await toggleFavoriteApi(kind, summary.id);
    } catch {
      setFavorites(prev);
      showToast('操作失败');
    }
  };

  const handleFavoriteClick = (summary: FavoriteSummary) => {
    if (summary.kind === 'article') {
      if (summary.url) window.open(summary.url, '_blank', 'noopener');
      return;
    }
    if (summary.kind === 'destiny_case') {
      handleCalcFromGanzhi(summary.gender, summary, {
        feedback: summary.feedback,
        source: summary.source,
      });
      return;
    }
    handleCalcFromGanzhi(summary.gender, summary);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-8 max-w-2xl mx-auto">
      {/* 账号卡片 */}
      <div className="bg-[#fdfcf8] rounded-[2rem] p-5 shadow-xl border border-stone-200/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-stone-300" />
          </div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-[#2b2320] text-white flex items-center justify-center shrink-0 shadow-md">
                <span className="text-lg font-bold font-calligraphy">
                  {(user.nickname || user.username).slice(0, 1)}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {showNicknameInput ? (
                    <NicknameEditor onDone={() => setShowNicknameInput(false)} />
                  ) : (
                    <button
                      onClick={() => setShowNicknameInput(true)}
                      className="text-base font-bold text-stone-800 hover:text-[#b39b7d] transition-colors flex items-center gap-1"
                    >
                      {user.nickname || user.username}
                      <span className="text-[10px] text-stone-300 font-normal">改昵称</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-400 truncate">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={async () => { await logout(); showToast('已退出登录'); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-500 hover:text-rose-500 hover:border-rose-200 transition-colors shrink-0"
            >
              <LogOut size={14} />
              退出
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-300 flex items-center justify-center">
              <UserIcon size={26} />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-600">登录后保存你的独有案例与收藏</p>
              <p className="text-[11px] text-stone-400 mt-1">云端同步排盘配置，换设备不丢失</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openAuth('login')}
                className="px-5 py-2.5 bg-[#2b2320] text-white rounded-full text-sm font-bold shadow-md active:scale-95 transition-all"
              >
                登录
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-5 py-2.5 bg-white text-[#2b2320] rounded-full text-sm font-bold border border-stone-200 shadow-sm active:scale-95 transition-all"
              >
                注册
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 子菜单 */}
      <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-stone-200/60 divide-y divide-stone-100">
        {([
          ['CASES', LayoutGrid, '我的案例', '保存在云端的排盘记录'],
          ['FAVORITES', Heart, '我的收藏', '收藏的命例、文章与案例'],
          ['SETTINGS', SlidersHorizontal, '我的设置', '排盘偏好与账号信息'],
          ['ABOUT', BookOpen, '作者·关于', '关于命海拾遗'],
        ] as [SubTab, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>, string, string][]).map(([key, Icon, label, desc]) => (
          <button
            key={key}
            onClick={() => {
              if (!isAuthenticated && key !== 'ABOUT') { openAuth('login'); return; }
              setSubTab(key);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all ${
              subTab === key ? 'bg-amber-50/70' : 'hover:bg-stone-50'
            }`}
          >
            <Icon size={17} strokeWidth={1.8} className={subTab === key ? 'text-[#b39b7d]' : 'text-stone-400'} />
            <div className="flex-1 text-left">
              <span className={`text-sm font-bold ${subTab === key ? 'text-[#2b2320]' : 'text-stone-600'}`}>{label}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={15} className="text-stone-300" />
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex flex-col gap-3">
        {subTab === 'CASES' && isAuthenticated && (
          <div className="bg-[#fdfcf8] rounded-[2rem] p-5 shadow-xl border border-stone-200/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-600">我的案例</h3>
              <span className="text-[10px] font-bold text-stone-300">{cases?.length ?? 0} 个</span>
            </div>
            {cases === null ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={22} className="animate-spin text-stone-300" />
              </div>
            ) : cases.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-bold text-stone-400">还没有保存的案例</p>
                <p className="text-[10px] text-stone-300 mt-1">在排盘结果页点击「保存到我的案例」即可收藏到云端</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <button
                      onClick={() => handleCalcFromGanzhi(c.gender, c, { name: c.subject_name || undefined, feedback: c.notes || undefined })}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.gender === 1 ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-600'}`}>
                          {c.gender === 1 ? '乾造' : '坤造'}
                        </span>
                        <span className="text-xs font-bold text-[#2b2320] truncate">{c.subject_name || '未命名案例'}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-bold mt-1 font-serif tracking-wide">{pillarSummary(c)}</p>
                      {c.notes && <p className="text-[10px] text-stone-400 truncate mt-0.5">{c.notes}</p>}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-2 rounded-lg text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                      title="删除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {subTab === 'FAVORITES' && isAuthenticated && (
          <div className="bg-[#fdfcf8] rounded-[2rem] p-5 shadow-xl border border-stone-200/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-600">我的收藏</h3>
              <span className="text-[10px] font-bold text-stone-300">{favorites?.length ?? 0} 条</span>
            </div>
            {favorites === null ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={22} className="animate-spin text-stone-300" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-bold text-stone-400">还没有收藏内容</p>
                <p className="text-[10px] text-stone-300 mt-1">点收藏图标即可收藏命例、文章或自己的案例</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map((f) => {
                  const s = f.object_summary;
                  if (!s) return null;
                  return (
                    <div key={f.id} className="flex items-center justify-between gap-2 bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <button onClick={() => handleFavoriteClick(s)} className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            s.kind === 'article'
                              ? 'bg-amber-100 text-amber-700'
                              : s.kind === 'user_case'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-stone-200 text-stone-600'
                          }`}>
                            {s.kind === 'article' ? '文章' : s.kind === 'user_case' ? '案例' : '命例'}
                          </span>
                          <span className="text-xs font-bold text-[#2b2320] truncate">
                            {favoriteTitle(s)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-bold mt-1 font-serif tracking-wide truncate">
                          {s.kind === 'article' ? (s.summary || s.category) : pillarSummary(s)}
                        </p>
                        {s.kind === 'destiny_case' && s.feedback && (
                          <p className="text-[10px] text-stone-400 mt-0.5 truncate">{s.feedback}</p>
                        )}
                        {s.kind === 'user_case' && s.notes && (
                          <p className="text-[10px] text-stone-400 mt-0.5 truncate">{s.notes}</p>
                        )}
                      </button>
                      <button
                        onClick={() => setUnfavTarget({ id: f.id, summary: s })}
                        className="p-2 rounded-lg text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        title="取消收藏"
                      >
                        <Heart size={15} fill="currentColor" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {subTab === 'SETTINGS' && isAuthenticated && (
          <div className="flex flex-col gap-3">
            <SettingsPanel />
            <div className="bg-[#fdfcf8] rounded-[2rem] p-5 shadow-xl border border-stone-200/60">
              <h3 className="text-sm font-bold text-stone-600 mb-3">账号</h3>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-stone-500">昵称</span>
                <span className="text-xs font-bold text-stone-700">{user?.nickname || '未设置'}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-stone-500">用户名</span>
                <span className="text-xs font-bold text-stone-700">@{user?.username}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs font-bold text-stone-500">注册时间</span>
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Clock size={12} className="text-stone-300" />
                  {user ? new Date(user.created_time).toLocaleDateString('zh-CN') : ''}
                </span>
              </div>
            </div>
          </div>
        )}

        {subTab === 'ABOUT' && <AuthorInfo />}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => {
          refreshCases();
          refreshFavorites();
        }}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="删除该案例？"
        message={deleteTarget ? `「${deleteTarget.subject_name || '未命名案例'}」删除后不可恢复。` : undefined}
        confirmText="删除"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeleteCase(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <ConfirmModal
        isOpen={unfavTarget !== null}
        title="取消收藏？"
        message={unfavTarget ? `确认将「${favoriteTitle(unfavTarget.summary)}」移出收藏？` : undefined}
        confirmText="取消收藏"
        cancelText="保留"
        onCancel={() => setUnfavTarget(null)}
        onConfirm={() => {
          if (unfavTarget) handleUnfavorite(unfavTarget.id, unfavTarget.summary);
          setUnfavTarget(null);
        }}
      />
    </div>
  );
};

const NicknameEditor: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { user, updateProfile } = useUserAuth();
  const { showToast } = useToast();
  const [value, setValue] = useState(user?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile(value.trim() || user!.username);
      showToast('昵称已更新');
      onDone();
    } catch {
      showToast('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone(); }}
        maxLength={64}
        className="w-32 bg-stone-100 rounded-lg px-2 py-1 text-sm font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#b39b7d]"
      />
      <button onClick={save} className="text-xs font-bold text-[#b39b7d] hover:text-amber-700 shrink-0">
        {saving ? '...' : '保存'}
      </button>
      <button onClick={onDone} className="text-xs font-bold text-stone-300 hover:text-stone-500 shrink-0">
        取消
      </button>
    </div>
  );
};

export default ProfilePage;
