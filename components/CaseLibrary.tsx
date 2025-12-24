
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MOCK_CASES } from '../data/caseLibrary';
import { CaseRecord, Gender } from '../types';
import { Book, Zap, Tags, X, Filter, Trash2, Search, Loader2, Database, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { ELEMENT_COLORS, STEM_ELEMENTS, BRANCH_ELEMENTS } from '../constants';

interface CaseLibraryProps {
  onSelectCase: (caseData: any) => void;
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

const CaseLibrary: React.FC<CaseLibraryProps> = ({ onSelectCase }) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [pillarFilters, setPillarFilters] = useState({
    year: '',
    month: '',
    day: '',
    hour: ''
  });

  // 性别映射逻辑：假设 0=女(坤), 1=男(乾)
  const mapGenderToApi = (g: string) => {
    if (g === Gender.MALE) return '1';
    if (g === Gender.FEMALE) return '0';
    return '';
  };

  const mapApiToGender = (val: number | string) => {
    const v = String(val);
    return (v === '1' || v === '男' || v === '乾') ? Gender.MALE : Gender.FEMALE;
  };

  /**
   * 将 API 返回的绝对路径 (如 http://127.0.0.1:8000/api/...) 
   * 转换为相对路径 (/api/...)，以便通过 Vite 代理转发。
   */
  const normalizeUrl = (url: string) => {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      return url;
    }
  };

  // 核心请求逻辑
  const fetchCases = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setIsAppending(true);
    else setIsLoading(true);
    
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterGender !== 'ALL') params.append('gender', mapGenderToApi(filterGender));
      if (pillarFilters.year) params.append('year_ganzhi', pillarFilters.year);
      if (pillarFilters.month) params.append('month_ganzhi', pillarFilters.month);
      if (pillarFilters.day) params.append('day_ganzhi', pillarFilters.day);
      if (pillarFilters.hour) params.append('hour_ganzhi', pillarFilters.hour);
      params.append('page_size', '12');

      const baseUrl = '/api/destiny-cases/';
      // 如果是加载更多，则使用 normalize 后的 nextUrl
      const url = isLoadMore && nextUrl ? normalizeUrl(nextUrl) : `${baseUrl}?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();

      const normalizedResults: CaseRecord[] = data.results.map((item: any) => ({
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
      console.error('Fetch error:', err);
      if (!isLoadMore) {
        setError('无法连接到命例数据库，已载入离线演示数据。');
        setCases(MOCK_CASES);
      }
    } finally {
      setIsLoading(false);
      setIsAppending(false);
    }
  }, [searchTerm, filterGender, pillarFilters, nextUrl]);

  // 初始加载及筛选变化时加载
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases(false);
    }, 400); // 防抖
    return () => clearTimeout(timer);
  }, [searchTerm, filterGender, pillarFilters]);

  const resetFilters = () => {
    setPillarFilters({ year: '', month: '', day: '', hour: '' });
    setFilterGender('ALL');
    setSearchTerm('');
  };

  const isFiltered = filterGender !== 'ALL' || pillarFilters.year || pillarFilters.month || pillarFilters.day || pillarFilters.hour || searchTerm;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* 顶部搜索与筛选 */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#2b2320] p-2.5 rounded-2xl text-white shadow-lg">
              <Database size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-stone-800 tracking-tight">命例数据库</span>
              <span className="text-[11px] text-stone-400 font-serif">
                {isLoading ? '正在检索...' : `匹配到 ${totalCount} 条命例`}
              </span>
            </div>
          </div>
          
          <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200/50 w-full md:w-auto">
             {['ALL', Gender.MALE, Gender.FEMALE].map(g => (
               <button 
                 key={g} 
                 onClick={() => setFilterGender(g)}
                 className={`flex-1 md:flex-initial px-5 py-2 rounded-xl text-[11px] font-bold transition-all ${filterGender === g ? 'bg-white text-[#2b2320] shadow-md ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-500'}`}
               >
                 {g === 'ALL' ? '全部' : g.split(' ')[0]}
               </button>
             ))}
          </div>
        </div>

        {/* 关键字搜索 */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-amber-600 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="搜标签、来源、反馈内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-[#2b2320] outline-none transition-all shadow-inner"
          />
        </div>

        {/* 四柱快捷过滤 */}
        <div className="grid grid-cols-4 gap-3 md:gap-4">
          {[
            { id: 'year', label: '年柱' },
            { id: 'month', label: '月柱' },
            { id: 'day', label: '日柱' },
            { id: 'hour', label: '时柱' }
          ].map((item) => (
            <div key={item.id} className="flex flex-col gap-2">
               <label className="text-[10px] text-stone-400 font-bold text-center uppercase tracking-widest">
                 {item.label}
               </label>
               <input 
                 type="text"
                 maxLength={2}
                 placeholder="干支"
                 value={(pillarFilters as any)[item.id]}
                 onChange={(e) => setPillarFilters({...pillarFilters, [item.id]: e.target.value})}
                 className="w-full bg-stone-50 border border-stone-100 rounded-xl py-2.5 text-center text-sm font-bold text-stone-800 focus:bg-white focus:border-amber-500 outline-none transition-all placeholder:text-stone-200"
               />
            </div>
          ))}
        </div>

        {isFiltered && (
          <button 
            onClick={resetFilters}
            className="flex items-center justify-center gap-2 py-3 bg-rose-50/50 text-rose-800 text-[11px] font-bold rounded-2xl hover:bg-rose-100 transition-all border border-rose-100/50 active:scale-[0.98]"
          >
            <Trash2 size={14} /> 重置所有条件
          </button>
        )}
      </div>

      {/* 命例列表展示 */}
      {isLoading && !isAppending ? (
        <div className="py-32 flex flex-col items-center gap-4 text-stone-300">
           <Loader2 size={40} className="animate-spin text-stone-200" />
           <p className="text-sm font-serif italic">正在从命海深处调取数据...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map((c) => (
            <div 
              key={c.id} 
              className="bg-white rounded-[2.5rem] border border-stone-200 p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50/30 -z-10 rounded-bl-[5rem]"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm ${c.gender === Gender.MALE ? 'bg-sky-50 text-sky-800 border border-sky-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                      {c.gender.split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-stone-400 font-serif flex items-center gap-1.5 opacity-80 truncate max-w-[120px]">
                      <Book size={14} /> {c.source}
                    </span>
                  </div>
                  <div className="flex gap-3">
                     <MiniPillar gan={c.yearGZ[0]} zhi={c.yearGZ[1]} />
                     <MiniPillar gan={c.monthGZ[0]} zhi={c.monthGZ[1]} />
                     <MiniPillar gan={c.dayGZ[0]} zhi={c.dayGZ[1]} />
                     <MiniPillar gan={c.hourGZ[0]} zhi={c.hourGZ[1]} />
                  </div>
                </div>
                <button 
                  onClick={() => onSelectCase(c)}
                  className="p-4.5 bg-[#2b2320] text-white rounded-[1.8rem] hover:bg-stone-800 transition-all shadow-xl active:scale-90 flex items-center justify-center group/btn relative overflow-hidden"
                >
                  <Zap size={24} className="group-hover/btn:scale-110 transition-transform relative z-10" fill="currentColor" />
                </button>
              </div>

              <div className="bg-stone-50/60 rounded-3xl p-5 mb-5 flex-1 border border-stone-100/50 group-hover:bg-white transition-colors">
                 <p className="text-sm text-stone-600 leading-relaxed italic line-clamp-4 font-serif">
                   “ {c.feedback} ”
                 </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto">
                 <Tags size={14} className="text-stone-300 mt-1" />
                 {c.tags.length > 0 ? c.tags.map(tag => (
                   <span key={tag} className="text-[10px] bg-stone-100 text-stone-500 px-3 py-1.5 rounded-xl font-bold tracking-tight">
                     #{tag}
                   </span>
                 )) : <span className="text-[10px] text-stone-300 py-1.5 italic">未分类</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加载更多 */}
      {!isLoading && nextUrl && (
        <button 
          onClick={() => fetchCases(true)}
          disabled={isAppending}
          className="my-8 py-4 flex items-center justify-center gap-3 bg-white border border-stone-200 rounded-[2rem] text-stone-500 font-bold text-sm shadow-sm hover:bg-stone-50 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isAppending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <ChevronDown size={18} />
              <span>载入更多命例 ({cases.length} / {totalCount})</span>
            </>
          )}
        </button>
      )}

      {!isLoading && cases.length === 0 && (
        <div className="py-40 text-center text-stone-300 flex flex-col items-center gap-6">
           <div className="w-20 h-20 rounded-full border border-stone-200 flex items-center justify-center">
             <Filter size={32} className="opacity-20" />
           </div>
           <p className="font-serif italic text-stone-400">大千世界，未见此局</p>
           <button onClick={resetFilters} className="text-xs text-amber-700 font-bold underline underline-offset-4">尝试清除筛选条件</button>
        </div>
      )}
    </div>
  );
};

export default CaseLibrary;
