
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CaseRecord, Gender } from '../types';
import { Trash2, Search, Loader2, Database, AlertCircle, ChevronDown, Sparkles, ArrowUp } from 'lucide-react';
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
    source: string;
    label: string;
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

const CaseLibrary: React.FC<CaseLibraryProps> = React.memo(({ onSelectCase, filters, onFiltersChange }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const nextUrlRef = useRef(nextUrl);
  useEffect(() => { nextUrlRef.current = nextUrl; }, [nextUrl]);
  const [error, setError] = useState<boolean>(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/destiny-cases/sources/')
      .then(res => res.json())
      .then(data => setSourceOptions(data.sources || []))
      .catch(() => {});
  }, []);

  // 使用解构方便代码引用
  const { gender: filterGender, source: filterSource, label: filterLabel, pillars: pillarFilters } = filters;

  const LABEL_KEYS = ['出身', '学历', '职业类别', '职业细分', '婚姻状态', '财富层次'];

  const parseLabelTags = (label: any): string[] => {
    if (!label) return [];
    try {
      const obj = JSON.parse(String(label));
      return LABEL_KEYS
        .map(key => obj[key])
        .filter(v => v !== undefined && v !== null && v !== '' && v !== 0);
    } catch {
      return String(label).split(/[，,]/).filter(Boolean);
    }
  };

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
      if (filterSource !== 'ALL') params.append('source', filterSource);
      if (filterLabel) params.append('label', filterLabel);
      if (pillarFilters.year) params.append('year_ganzhi', pillarFilters.year);
      if (pillarFilters.month) params.append('month_ganzhi', pillarFilters.month);
      if (pillarFilters.day) params.append('day_ganzhi', pillarFilters.day);
      if (pillarFilters.hour) params.append('hour_ganzhi', pillarFilters.hour);
      params.append('page_size', '12');

      let targetUrl = '';
      if (isLoadMore && nextUrlRef.current) {
        targetUrl = normalizeUrl(nextUrlRef.current);
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
        tags: parseLabelTags(item.label)
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
  }, [filterGender, filterSource, filterLabel, pillarFilters]);

  useEffect(() => {
    fetchCases(false);
  }, [filterGender, filterSource, filterLabel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [pillarFilters]);

  const resetFilters = () => {
    onFiltersChange({
      gender: 'ALL',
      source: 'ALL',
      label: '',
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

  const toggleExpand = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isFiltered = filterGender !== 'ALL' || filterSource !== 'ALL' || filterLabel || pillarFilters.year || pillarFilters.month || pillarFilters.day || pillarFilters.hour;

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={topRef} className="flex flex-col gap-3 animate-fade-in">
      {/* 筛选面板 */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col gap-5">
        {/* 第一行：性别 */}
        <div className="flex justify-center">
          <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200/50">
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

        {/* 第二行：来源 + 关键词 */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <select
            value={filterSource}
            onChange={(e) => onFiltersChange({ ...filters, source: e.target.value })}
            className="w-full md:w-auto bg-stone-100 border-none rounded-xl py-2 px-4 text-[11px] font-bold text-stone-600 outline-none focus:ring-1 focus:ring-stone-200 cursor-pointer"
          >
            <option value="ALL">全部来源</option>
            {sourceOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="relative w-full md:flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
            <input
              type="text"
              value={filterLabel}
              onChange={(e) => onFiltersChange({ ...filters, label: e.target.value })}
              placeholder="搜索标签关键词..."
              className="w-full bg-stone-100 border-none rounded-xl py-2 pl-9 pr-3 text-[11px] font-bold text-stone-600 outline-none focus:ring-1 focus:ring-stone-200 placeholder:text-stone-300"
            />
          </div>
        </div>

        {/* 第三行：四柱 */}
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

      {/* 公众号关注引导 — 长期显示 */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 rounded-[2rem] border border-amber-200/60 shadow-sm p-5 flex items-center gap-4 animate-fade-in">
        <div className="w-14 h-14 bg-white rounded-xl border border-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
          <img src="/qrcode.jpg" alt="公众号二维码" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-stone-700">长按识别关注公众号</p>
          <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">获取体系教程、深度案例与源流考据</p>
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
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {c.tags.slice(0, 6).map((t, idx) => (
                          <span key={idx} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md whitespace-nowrap">{t}</span>
                        ))}
                        {c.tags.length > 6 && (
                          <span className="text-[10px] text-stone-400 px-1 py-0.5">+{c.tags.length - 6}</span>
                        )}
                      </div>
                    </div>
                  </div>
               </div>

               <div className="flex justify-between bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                  <MiniPillar gan={c.yearGZ[0]} zhi={c.yearGZ[1]} />
                  <MiniPillar gan={c.monthGZ[0]} zhi={c.monthGZ[1]} />
                  <MiniPillar gan={c.dayGZ[0]} zhi={c.dayGZ[1]} />
                  <MiniPillar gan={c.hourGZ[0]} zhi={c.hourGZ[1]} />
               </div>

               <div className="flex flex-col gap-1.5">
                 <p className={`text-xs text-stone-500 leading-relaxed ${expandedIds.has(c.id) ? '' : 'line-clamp-2'}`}>
                   {c.feedback}
                 </p>
                 <button
                   onClick={(e) => toggleExpand(c.id, e)}
                   className="self-start text-[11px] font-bold text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-0.5"
                 >
                   {expandedIds.has(c.id) ? '收起' : '展开'}
                   <ChevronDown size={10} className={`transition-transform ${expandedIds.has(c.id) ? 'rotate-180' : ''}`} />
                 </button>
               </div>
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

      {/* 错误状态 */}
      {!isLoading && error && (
        <div className="bg-white rounded-[2.5rem] py-12 px-8 md:py-20 border border-rose-200 border-dashed flex flex-col items-center justify-center text-center animate-fade-in shadow-inner">
           <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-5">
              <AlertCircle size={32} />
           </div>
           <h3 className="text-rose-600 font-bold text-lg">网络连接失败</h3>
           <p className="text-stone-400 text-sm mt-2">无法连接到服务器，请检查网络后重试</p>
           <button
             onClick={() => fetchCases(false)}
             className="mt-5 px-5 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
           >
             重新加载
           </button>
        </div>
      )}

      {/* 空结果状态 */}
      {!isLoading && !error && cases.length === 0 && (
        <div className="bg-white rounded-[2.5rem] py-12 px-8 md:py-20 border border-stone-200 border-dashed flex flex-col items-center justify-center text-center animate-fade-in shadow-inner">
           <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-5">
              <Sparkles size={32} />
           </div>
           <h3 className="text-stone-400 font-bold text-lg">系统中当前无匹配记录</h3>
           <p className="text-stone-300 text-sm mt-2 tracking-widest font-serif italic">命海拾遗</p>
           {isFiltered && (
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

      {/* 回到顶部 */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 right-4 md:right-8 z-50 w-10 h-10 bg-white/90 backdrop-blur border border-stone-200 rounded-full shadow-lg flex items-center justify-center text-stone-400 hover:text-[#2b2320] hover:border-stone-300 transition-all animate-fade-in"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
});

export default CaseLibrary;
