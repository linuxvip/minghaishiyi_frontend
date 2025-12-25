
import React, { useState, useEffect, useCallback } from 'react';
import { CaseRecord, Gender } from '../types';
import { Zap, Trash2, Search, Loader2, Database, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { ELEMENT_COLORS, STEM_ELEMENTS, BRANCH_ELEMENTS, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants';

/**
 * 生产环境下，由于使用了 Nginx 反向代理，API_BASE_URL 应保持为空
 * 请求将通过相对路径 /api 发起，由 Nginx 进行拦截并转发。
 */
const API_BASE_URL = ''; 

interface CaseLibraryProps {
  onSelectCase: (caseData: any) => void;
  filters: {
    gender: string;
    pillars: { year: string; month: string; day: string; hour: string };
  };
  onFiltersChange: (newFilters: any) => void;
}

const MiniPillar: React.FC<{ gan: string; zhi: string }> = ({ gan, zhi }) => {
  const ganElem = STEM_ELEMENTS[gan] || '';
  const zhiElem = BRANCH_ELEMENTS[zhi] || '';
  const ganCol = ELEMENT_COLORS[ganElem] || ELEMENT_COLORS.default;
  const zhiCol = ELEMENT_COLORS[zhiElem] || ELEMENT_COLORS.default;

  return (
    <div className="flex flex-col gap-0.5 items-center scale-90 md:scale-100">
      <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-md border text-xs md:text-sm font-bold ${ganCol.bg} ${ganCol.border} ${ganCol.text}`}>
        {gan || '?'}
      </div>
      <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-md border text-xs md:text-sm font-bold ${zhiCol.bg} ${zhiCol.border} ${zhiCol.text}`}>
        {zhi || '?'}
      </div>
    </div>
  );
};

const CaseLibrary: React.FC<CaseLibraryProps> = ({ onSelectCase, filters, onFiltersChange }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  // 使用解构方便代码引用
  const { gender: filterGender, pillars: pillarFilters } = filters;

  const mapGenderToApi = (g: string) => {
    if (g === Gender.MALE) return '1';
    if (g === Gender.FEMALE) return '0';
    return '';
  };

  const mapApiToGender = (val: number | string) => {
    const v = String(val);
    return (v === '1' || v === '男' || v === '乾') ? Gender.MALE : Gender.FEMALE;
  };

  const normalizeUrl = (url: string) => {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      return url.startsWith('/api') ? url : `/api${url}`;
    }
  };

  const fetchCases = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setIsAppending(true);
    else setIsLoading(true);
    
    setError(false);

    try {
      const params = new URLSearchParams();
      if (filterGender !== 'ALL') params.append('gender', mapGenderToApi(filterGender));
      if (pillarFilters.year) params.append('year_ganzhi', pillarFilters.year);
      if (pillarFilters.month) params.append('month_ganzhi', pillarFilters.month);
      if (pillarFilters.day) params.append('day_ganzhi', pillarFilters.day);
      if (pillarFilters.hour) params.append('hour_ganzhi', pillarFilters.hour);
      params.append('page_size', '12');

      let targetUrl = '';
      if (isLoadMore && nextUrl) {
        targetUrl = normalizeUrl(nextUrl);
      } else {
        targetUrl = `/api/destiny-cases/?${params.toString()}`;
      }

      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();

      const normalizedResults: CaseRecord[] = (data.results || []).map((item: any) => ({
        id: String(item.id),
        source: item.source || '未知来源',
        gender: mapApiToGender(item.gender),
        yearGZ: item.year_ganzhi || '',
        monthGZ: item.month_ganzhi || '',
        dayGZ: item.day_ganzhi || '',
        hourGZ: item.hour_ganzhi || '',
        feedback: item.feedback || '暂无反馈内容',
        tags: item.label ? String(item.label).split(/[，,]/) : []
      }));

      if (isLoadMore) {
        setCases(prev => [...prev, ...normalizedResults]);
      } else {
        setCases(normalizedResults);
      }
      
      setTotalCount(data.count || 0);
      setNextUrl(data.next);
    } catch (err) {
      console.warn('[CaseLibrary] Connection failed.', err);
      setError(true);
      if (!isLoadMore) {
        setCases([]);
      }
    } finally {
      setIsLoading(false);
      setIsAppending(false);
    }
  }, [filterGender, pillarFilters, nextUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [filterGender, pillarFilters]);

  const resetFilters = () => {
    onFiltersChange({
      gender: 'ALL',
      pillars: { year: '', month: '', day: '', hour: '' }
    });
  };

  const handleGenderChange = (g: string) => {
    onFiltersChange({ ...filters, gender: g });
  };

  const handlePillarChange = (pKey: string, val: string) => {
    onFiltersChange({
      ...filters,
      pillars: { ...pillarFilters, [pKey]: val }
    });
  };

  const isFiltered = filterGender !== 'ALL' || pillarFilters.year || pillarFilters.month || pillarFilters.day || pillarFilters.hour;

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* 筛选面板 */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200/50 w-full md:w-auto max-w-sm">
             {['ALL', Gender.MALE, Gender.FEMALE].map(g => (
               <button 
                 key={g} 
                 onClick={() => handleGenderChange(g)}
                 className={`flex-1 md:flex-initial px-8 py-2 rounded-xl text-[11px] font-bold transition-all ${filterGender === g ? 'bg-white text-[#2b2320] shadow-md ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-500'}`}
               >
                 {g === 'ALL' ? '全部' : g.split(' ')[0]}
               </button>
             ))}
          </div>
        </div>

        {/* 筛选输入框区域 */}
        <div className="grid grid-cols-4 gap-3 md:gap-4">
          {['year', 'month', 'day', 'hour'].map((p) => (
             <div key={p} className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                 {p === 'year' ? '年柱' : p === 'month' ? '月柱' : p === 'day' ? '日柱' : '时柱'}
               </span>
               <div className="relative">
                 <input 
                   type="text"
                   value={(pillarFilters as any)[p]}
                   onChange={(e) => handlePillarChange(p, e.target.value)}
                   placeholder="全部"
                   className="w-full bg-stone-100 border-none rounded-xl py-2 px-3 text-xs font-bold text-stone-700 focus:ring-1 focus:ring-stone-200 outline-none placeholder:text-stone-300"
                 />
               </div>
             </div>
          ))}
        </div>

        {/* 底部统计与清空操作栏 */}
        <div className="flex items-center justify-between px-1 border-t border-stone-50 pt-4">
           <div className="flex items-center gap-2">
              <Database size={13} className={`transition-colors ${isLoading ? 'text-amber-400 animate-pulse' : 'text-amber-500'}`} />
              <span className="text-[11px] font-bold text-stone-400">
                {isLoading ? '正在检索命例...' : `匹配到 ${totalCount} 条命例`}
              </span>
           </div>

           {isFiltered && (
             <button 
               onClick={resetFilters}
               className="flex items-center gap-1.5 text-stone-300 hover:text-rose-600 transition-all text-[11px] font-bold"
             >
               <Trash2 size={12} />
               <span>清空筛选条件</span>
             </button>
           )}
        </div>
      </div>

      {/* 命例列表区域 */}
      {cases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((c) => (
            <div 
              key={c.id}
              onClick={() => onSelectCase(c)}
              className="bg-white p-5 rounded-3xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4"
            >
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${c.gender === Gender.MALE ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>
                      {c.gender === Gender.MALE ? '乾' : '坤'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-800">{c.source}</span>
                      <div className="flex gap-1 mt-0.5">
                        {c.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/50 rounded-xl text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700 transition-all duration-300 shadow-sm group-hover:shadow-md active:scale-95">
                    <Zap size={14} className="fill-amber-500/10" />
                    <span className="text-[10px] font-bold tracking-tight">命例排盘</span>
                  </div>
               </div>

               <div className="flex justify-between bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                  <MiniPillar gan={c.yearGZ[0]} zhi={c.yearGZ[1]} />
                  <MiniPillar gan={c.monthGZ[0]} zhi={c.monthGZ[1]} />
                  <MiniPillar gan={c.dayGZ[0]} zhi={c.dayGZ[1]} />
                  <MiniPillar gan={c.hourGZ[0]} zhi={c.hourGZ[1]} />
               </div>

               <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                 {c.feedback}
               </p>
            </div>
          ))}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && !isAppending && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="animate-spin text-stone-300" size={32} />
          <span className="text-sm font-bold text-stone-300">正在搜寻命理真踪...</span>
        </div>
      )}

      {/* 无数据或错误状态：系统维护提示 */}
      {!isLoading && (error || cases.length === 0) && (
        <div className="bg-white rounded-[2.5rem] py-12 px-8 md:py-20 border border-stone-200 border-dashed flex flex-col items-center justify-center text-center animate-fade-in shadow-inner">
           <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-5">
              {error ? <AlertCircle size={32} /> : <Sparkles size={32} />}
           </div>
           <h3 className="text-stone-400 font-bold text-lg">系统正常维护中</h3>
           <p className="text-stone-300 text-sm mt-2 tracking-widest font-serif italic">期待更好相遇</p>
           {isFiltered && !error && (
             <button 
               onClick={resetFilters}
               className="mt-6 text-amber-600 text-xs font-bold hover:underline"
             >
               尝试清除筛选条件
             </button>
           )}
        </div>
      )}

      {/* 加载更多 */}
      {nextUrl && !error && (
        <button 
          onClick={() => fetchCases(true)}
          disabled={isAppending}
          className="w-full py-4 bg-white border border-stone-200 rounded-2xl text-stone-500 text-sm font-bold hover:bg-stone-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isAppending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>加载中...</span>
            </>
          ) : (
            <>
              <span>加载更多命例</span>
              <ChevronDown size={16} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CaseLibrary;
