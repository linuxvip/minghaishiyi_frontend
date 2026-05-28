import React, { useState, useEffect } from 'react';
import { Users, Library, AlertCircle } from 'lucide-react';
import adminClient from '../api/client';
import { getDestinyCaseSourcesApi } from '../api/destiny-cases';

/* ───── 总览卡片 ───── */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, count, color, loading }) => (
  <div className="bg-white rounded-2xl border border-stone-200 p-6 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-stone-400 font-bold tracking-widest uppercase">{label}</p>
      {loading ? (
        <div className="w-8 h-5 bg-stone-100 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-stone-800">{count}</p>
      )}
    </div>
  </div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [genderData, setGenderData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [sourceData, setSourceData] = useState<{ label: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [usersRes, casesRes, sourcesRes] = await Promise.all([
          adminClient.get('/admin-api/users/', { params: { page_size: 1 } }),
          adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1 } }),
          getDestinyCaseSourcesApi(),
        ]);
        setUserCount(usersRes.data.count);
        const totalCases = casesRes.data.count;
        setCaseCount(totalCases);

        const sources: string[] = sourcesRes.data.sources;

        // 性别
        const [maleRes, femaleRes] = await Promise.all([
          adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1, gender: '1' } }),
          adminClient.get('/admin-api/destiny-cases/', { params: { page_size: 1, gender: '0' } }),
        ]);
        setGenderData([
          { label: '男', value: maleRes.data.count, color: '#0ea5e9' },
          { label: '女', value: femaleRes.data.count, color: '#f43f5e' },
        ]);

        // 来源
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
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold text-stone-800 mb-6">仪表盘</h1>

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold mb-6">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>统计数据加载失败，请刷新页面重试</span>
        </div>
      )}

      {/* 总览 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl mb-6">
        <StatCard
          icon={<Users size={22} className="text-sky-600" />}
          label="用户总数"
          count={userCount}
          color="bg-sky-50"
          loading={loading}
        />
        <StatCard
          icon={<Library size={22} className="text-emerald-600" />}
          label="命例总数"
          count={caseCount}
          color="bg-emerald-50"
          loading={loading}
        />
      </div>

      {/* 命例分析 */}
      <h2 className="text-sm font-bold text-stone-600 mb-4">命例分析</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {/* 性别分布 */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">性别分布</h3>
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
        </div>

        {/* 来源分布 */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">来源分布</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 h-4 bg-stone-100 rounded" />
                  <div className="flex-1 h-5 bg-stone-100 rounded-full animate-pulse" />
                  <div className="w-8 h-4 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <BarChart items={sourceData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
