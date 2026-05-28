import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Library, BookOpen, RefreshCw, Plus, Clock, User, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import adminClient from '../api/client';
import { getDestinyCaseSourcesApi } from '../api/destiny-cases';
import { getAuditLogsApi } from '../api/audit-logs';
import { AuditLogEntry } from '../types/admin';

/* ───── 工具函数 ───── */

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: '创建', color: 'text-emerald-600' },
  UPDATE: { label: '修改', color: 'text-amber-600' },
  DELETE: { label: '删除', color: 'text-rose-600' },
};

const MODEL_LABELS: Record<string, string> = {
  user: '用户',
  DestinyCase: '命例',
  Article: '文章',
  Group: '用户组',
};

const formatRelativeTime = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

/* ───── 骨架屏 ───── */

const Skeleton: React.FC = () => (
  <div className="animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <div className="w-20 h-7 bg-stone-100 rounded-lg" />
      <div className="w-8 h-8 bg-stone-100 rounded-lg" />
    </div>

    {/* 快捷操作骨架 */}
    <div className="flex gap-2 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-28 h-9 bg-stone-100 rounded-xl" />
      ))}
    </div>

    {/* 卡片骨架 */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-4xl mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100" />
            <div className="flex-1">
              <div className="w-12 h-3 bg-stone-100 rounded mb-1.5" />
              <div className="w-8 h-6 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* 图表骨架 */}
    <div className="mb-6">
      <div className="w-16 h-4 bg-stone-100 rounded mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 h-48" />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 h-48" />
      </div>
    </div>

    {/* 日志骨架 */}
    <div>
      <div className="w-16 h-4 bg-stone-100 rounded mb-3" />
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-stone-100" />
            <div className="flex-1 h-4 bg-stone-100 rounded" />
            <div className="w-16 h-3 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ───── 区块级错误提示 ───── */

const BlockError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="flex items-center justify-center py-8 text-center">
    <div className="flex flex-col items-center gap-2">
      <AlertCircle size={18} className="text-stone-300" />
      <span className="text-xs text-stone-400 font-bold">加载失败</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
        >
          点击重试
        </button>
      )}
    </div>
  </div>
);

/* ───── 可点击统计卡片 ───── */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, count, color, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-amber-200 transition-all duration-200 text-left w-full cursor-pointer group"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-stone-400 font-bold tracking-widest uppercase">{label}</p>
      <p className="text-2xl font-bold text-stone-800">{count.toLocaleString()}</p>
    </div>
    <ChevronRight size={16} className="text-stone-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
  </button>
);

/* ───── SVG 环形图 ───── */

const DonutChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  total: number;
  size?: number;
}> = ({ segments, total, size = 120 }) => {
  const strokeW = 14;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-stone-300">暂无数据</span>
      </div>
    );
  }

  let cumOffset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => {
        const dashLen = (seg.value / total) * circumference;
        const offset = cumOffset;
        cumOffset += dashLen;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dashLen} ${circumference}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
            className="transition-all duration-500"
          />
        );
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-stone-700">
        {total}
      </text>
    </svg>
  );
};

/* ───── 水平条形图 ───── */

const BarChart: React.FC<{
  items: { label: string; value: number; color?: string }[];
}> = ({ items }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-14 sm:w-20 text-[10px] font-bold text-stone-500 text-right truncate flex-shrink-0" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(item.value / max) * 100}%`,
                minWidth: item.value > 0 ? 4 : 0,
                backgroundColor: item.color || '#f59e0b',
              }}
            />
          </div>
          <span className="w-8 text-[10px] font-bold text-stone-400 text-right flex-shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ───── 仪表盘页面 ───── */

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 卡片数据
  const [userCount, setUserCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);

  // 图表数据
  const [genderData, setGenderData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [sourceData, setSourceData] = useState<{ label: string; value: number; color: string }[]>([]);

  // 日志
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);

  // 各区块错误状态
  const [cardsError, setCardsError] = useState(false);
  const [genderError, setGenderError] = useState(false);
  const [sourceError, setSourceError] = useState(false);
  const [logsError, setLogsError] = useState(false);

  const fetchAll = useCallback(async () => {
    setCardsError(false);
    setGenderError(false);
    setSourceError(false);
    setLogsError(false);

    // ── 卡片数据（并行） ──
    try {
      const [usersRes, casesRes, articlesRes] = await Promise.all([
        adminClient.get('/admin-api/users/', { params: { page_size: 1 } }),
        adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1 } }),
        adminClient.get('/admin-api/articles/', { params: { page_size: 1 } }),
      ]);
      setUserCount(usersRes.data.count);
      setCaseCount(casesRes.data.count);
      setArticleCount(articlesRes.data.count);
    } catch {
      setCardsError(true);
    }

    // ── 来源列表 ──
    let sources: string[] = [];
    try {
      const sourcesRes = await getDestinyCaseSourcesApi();
      sources = sourcesRes.data.sources;
    } catch {
      // sources 为空不影响卡片
    }

    // ── 性别分布 ──
    try {
      const [maleRes, femaleRes] = await Promise.all([
        adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1, gender: '1' } }),
        adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1, gender: '0' } }),
      ]);
      setGenderData([
        { label: '男', value: maleRes.data.count, color: '#0ea5e9' },
        { label: '女', value: femaleRes.data.count, color: '#f43f5e' },
      ]);
    } catch {
      setGenderError(true);
    }

    // ── 来源分布 ──
    if (sources.length > 0) {
      try {
        const sourceColors = ['#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316'];
        const sourceCounts = await Promise.all(
          sources.map((s) =>
            adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1, source: s } })
          )
        );
        setSourceData(
          sources.map((s, i) => ({
            label: s,
            value: sourceCounts[i].data.count,
            color: sourceColors[i % sourceColors.length],
          }))
        );
      } catch {
        setSourceError(true);
      }
    }

    // ── 最近操作日志 ──
    try {
      const logsRes = await getAuditLogsApi({ page: 1, page_size: 5 });
      setRecentLogs(logsRes.data.results);
    } catch {
      setLogsError(true);
    }
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  if (loading) return <Skeleton />;

  return (
    <div className="animate-fade-in">
      {/* ── 标题栏 ── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-stone-800">仪表盘</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors disabled:opacity-60"
          title="刷新数据"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── 快捷操作 ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => navigate('/admin/destiny-cases/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/30 transition-all active:scale-95"
        >
          <Plus size={14} />
          新建命例
        </button>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/30 transition-all active:scale-95"
        >
          <Plus size={14} />
          新建用户
        </button>
        <button
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50/30 transition-all active:scale-95"
        >
          <Plus size={14} />
          新建文章
        </button>
      </div>

      {/* ── 总览卡片 ── */}
      {cardsError ? (
        <BlockError onRetry={handleRefresh} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 max-w-4xl mb-6">
          <StatCard
            icon={<Users size={22} className="text-sky-600" />}
            label="用户总数"
            count={userCount}
            color="bg-sky-50"
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            icon={<Library size={22} className="text-emerald-600" />}
            label="命例总数"
            count={caseCount}
            color="bg-emerald-50"
            onClick={() => navigate('/admin/destiny-cases')}
          />
          <StatCard
            icon={<BookOpen size={22} className="text-violet-600" />}
            label="文章总数"
            count={articleCount}
            color="bg-violet-50"
            onClick={() => navigate('/admin/articles')}
          />
        </div>
      )}

      {/* ── 命例分析 ── */}
      <h2 className="text-sm font-bold text-stone-600 mb-4">命例分析</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-6">
        {/* 性别分布 */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">性别分布</h3>
          {genderError ? (
            <BlockError onRetry={handleRefresh} />
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart segments={genderData} total={caseCount} size={120} />
              <div className="flex flex-col gap-2">
                {genderData.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-xs text-stone-500">{g.label}</span>
                    <span className="text-xs font-bold text-stone-700">{g.value}</span>
                    <span className="text-[10px] text-stone-300">
                      ({caseCount > 0 ? Math.round((g.value / caseCount) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 来源分布 */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">来源分布</h3>
          {sourceError ? (
            <BlockError onRetry={handleRefresh} />
          ) : sourceData.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs text-stone-300">暂无数据</span>
            </div>
          ) : (
            <BarChart items={sourceData} />
          )}
        </div>
      </div>

      {/* ── 最近操作日志 ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-stone-600">最近操作</h2>
        <button
          onClick={() => navigate('/admin/audit-logs')}
          className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-amber-600 transition-colors"
        >
          查看全部
          <ChevronRight size={12} />
        </button>
      </div>

      {logsError ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <BlockError onRetry={handleRefresh} />
        </div>
      ) : recentLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <div className="flex items-center justify-center py-6">
            <span className="text-xs text-stone-300">暂无操作记录</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-stone-50">
            {recentLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-3 hover:bg-stone-50/30 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  log.action === 'CREATE' ? 'bg-emerald-400' :
                  log.action === 'UPDATE' ? 'bg-amber-400' :
                  'bg-rose-400'
                }`} />
                <div className="flex-1 min-w-0 flex items-center gap-2 text-xs">
                  <span className="font-bold text-stone-700 flex-shrink-0">{log.user_name || '系统'}</span>
                  <span className={`font-bold flex-shrink-0 ${ACTION_LABELS[log.action]?.color || 'text-stone-500'}`}>
                    {ACTION_LABELS[log.action]?.label || log.action}
                  </span>
                  <span className="text-stone-500 truncate">
                    {MODEL_LABELS[log.model_name] || log.model_name}#{log.object_id}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 flex-shrink-0">{formatRelativeTime(log.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
