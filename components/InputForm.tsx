
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarType, Gender } from '../types';
import { MapPin, Search, ChevronRight, User, Calendar as CalendarIcon, Loader2, SlidersHorizontal } from 'lucide-react';
import { Solar, Lunar, LunarYear, LunarMonth } from 'lunar-typescript';
import type { AreaNode } from '../utils/areaData';
import { convertToTrueSolarTime, getMonthStem, getHourStem } from '../utils/baziHelper';
import { findAllSolarDatesFromBaZi } from '../utils/baziCalc';
import { ELEMENT_COLORS, STEM_ELEMENTS, BRANCH_ELEMENTS, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants';
import { useToast } from './Toast';
import { useUserAuth } from '../user/contexts/UserAuthContext';
import { TIMEZONE_OPTIONS, applyPreferences } from '../user/preferences';

interface InputFormProps {
  onCalculate: (data: any) => Promise<boolean>;
}

interface SolarDT { year: number; month: number; day: number; hour: number; minute: number; }
interface LunarDT { year: number; month: number; leap: boolean; day: number; hour: number; minute: number; }
interface DirectDT {
  yearGan: string; yearZhi: string; monthGan: string; monthZhi: string;
  dayGan: string; dayZhi: string; hourGan: string; hourZhi: string;
  matchedSolar?: { year: number; month: number; day: number; hour: number; minute: number };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

const YEAR_MIN = 1850;
const YEAR_MAX = 2100;

const MONTH_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

const solarToLunar = (s: SolarDT): LunarDT => {
  const l = Solar.fromYmdHms(s.year, s.month, s.day, s.hour, s.minute, 0).getLunar();
  return { year: l.getYear(), month: Math.abs(l.getMonth()), leap: l.getMonth() < 0, day: l.getDay(), hour: s.hour, minute: s.minute };
};

const lunarToSolar = (l: LunarDT): SolarDT => {
  const s = Lunar.fromYmdHms(l.year, l.leap ? -l.month : l.month, l.day, l.hour, l.minute, 0).getSolar();
  return { year: s.getYear(), month: s.getMonth(), day: s.getDay(), hour: l.hour, minute: l.minute };
};

// 某农历年可选月份（含闰月，闰月用负值表示）
const buildLunarMonths = (year: number): { v: number; label: string }[] => {
  const leap = LunarYear.fromYear(year).getLeapMonth();
  const months: { v: number; label: string }[] = [];
  for (let m = 1; m <= 12; m++) months.push({ v: m, label: `${m}月` });
  if (leap) months.splice(leap, 0, { v: -leap, label: `闰${leap}月` });
  return months;
};

const buildYearItems = (): { v: number; label: string }[] => {
  const arr: { v: number; label: string }[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) arr.push({ v: y, label: String(y) });
  return arr;
};

const YEAR_ITEMS = buildYearItems();

const LocationPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (province: string, city: string, district: string, lng: number, lat?: number) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [pIdx, setPIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [dIdx, setDIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaData, setAreaData] = useState<AreaNode[] | null>(null);
  const provRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const distRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !areaData) {
      import('../utils/areaData').then(m => setAreaData(m.CHINA_AREA_DATA));
    }
  }, [isOpen, areaData]);

  // 选中项变化时，三列自动滚动到对应项并居中（配合高亮，让用户看到选中结果）
  useEffect(() => {
    const center = (el: HTMLDivElement | null, idx: number) => {
      const item = el?.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
      item?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    center(provRef.current, pIdx);
    center(cityRef.current, cIdx);
    center(distRef.current, dIdx);
  }, [pIdx, cIdx, dIdx]);

  const provinces = areaData || [];
  const cities = provinces[pIdx]?.c || [];
  const districts = cities[cIdx]?.c || [];

  // 全局搜索：跨省/市/区县全量匹配，带完整路径与定位索引
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const results: { name: string; path: string; pIdx: number; cIdx: number; dIdx: number }[] = [];
    provinces.forEach((p, pi) => {
      if (p.n.includes(q)) results.push({ name: p.n, path: p.n, pIdx: pi, cIdx: 0, dIdx: 0 });
      (p.c || []).forEach((c, ci) => {
        if (c.n.includes(q)) results.push({ name: c.n, path: `${p.n} · ${c.n}`, pIdx: pi, cIdx: ci, dIdx: 0 });
        (c.c || []).forEach((d, di) => {
          if (d.n.includes(q)) results.push({ name: d.n, path: `${p.n} · ${c.n} · ${d.n}`, pIdx: pi, cIdx: ci, dIdx: di });
        });
      });
    });
    return results;
  }, [provinces, searchQuery]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const p = provinces[pIdx].n;
    const c = cities[cIdx]?.n || '';
    const d = districts[dIdx]?.n || '';
    const lng = districts[dIdx]?.l || cities[cIdx]?.l || provinces[pIdx].l || 120.0;
    const lat = districts[dIdx]?.lat || cities[cIdx]?.lat || provinces[pIdx].lat;
    onConfirm(p, c, d, lng, lat);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleProvinceClick = (origIdx: number) => {
    setPIdx(origIdx);
    setCIdx(0);
    setDIdx(0);
  };

  const handleResultClick = (r: { pIdx: number; cIdx: number; dIdx: number }) => {
    setPIdx(r.pIdx);
    setCIdx(r.cIdx);
    setDIdx(r.dIdx);
    setSearchQuery('');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#fdfcf8] w-full max-w-lg rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up border-t border-stone-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button onClick={handleClose} className="text-stone-400 text-lg hover:text-stone-600 transition-colors">取消</button>
          <div className="text-sm font-bold text-stone-500">选择出生地点</div>
          <div className="w-8"></div>
        </div>

        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input
              type="text"
              placeholder="搜索省 / 市 / 区县"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-100 border-none rounded-2xl py-3 pl-11 pr-4 focus:ring-1 focus:ring-stone-200 text-stone-700 placeholder:text-stone-300"
            />
          </div>
        </div>

        <div className="relative h-72 flex overflow-hidden border-t border-stone-100">
          <div className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 border-y border-stone-200/50 pointer-events-none z-10 bg-stone-500/5"></div>

          {searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {searchResults.map((r, i) => (
                  <div
                    key={`${r.path}-${i}`}
                    onClick={() => handleResultClick(r)}
                    className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-stone-100 cursor-pointer border-b border-stone-50"
                  >
                    <span className="text-sm font-bold text-[#2b2320]">{r.name}</span>
                    <span className="text-[11px] text-stone-400 truncate">{r.path}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-stone-300">未找到相关地点，试试省份名（如：河北）</div>
            )
          ) : (
            <>
              <div ref={provRef} className="flex-1 overflow-y-auto no-scrollbar py-32 snap-y snap-mandatory text-center">
                 {provinces.map((p, i) => (
                   <div key={p.n} data-idx={i} onClick={() => handleProvinceClick(i)} className={`h-12 flex items-center justify-center snap-center text-sm transition-all cursor-pointer ${pIdx === i ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-400 hover:text-stone-600'}`}>
                     {p.n}
                   </div>
                 ))}
              </div>
              <div ref={cityRef} className="flex-1 overflow-y-auto no-scrollbar py-32 snap-y snap-mandatory text-center">
                 {cities.map((c, i) => (
                   <div key={c.n} data-idx={i} onClick={() => {setCIdx(i); setDIdx(0);}} className={`h-12 flex items-center justify-center snap-center text-sm transition-all cursor-pointer ${cIdx === i ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-300'}`}>
                     {c.n}
                   </div>
                 ))}
              </div>
              <div ref={distRef} className="flex-1 overflow-y-auto no-scrollbar py-32 snap-y snap-mandatory text-center">
                 {districts.map((d, i) => (
                   <div key={d.n} data-idx={i} onClick={() => setDIdx(i)} className={`h-12 flex items-center justify-center snap-center text-sm transition-all cursor-pointer ${dIdx === i ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-300'}`}>
                     {d.n}
                   </div>
                 ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-white border-t border-stone-100">
          <button onClick={handleConfirm} className="w-full py-4 bg-[#2b2320] text-white rounded-full text-lg font-bold shadow-lg active:scale-95 transition-all">确定选择</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ITEM_H = 48;

// 通用滑动选择轮盘（单列）
const WheelColumn: React.FC<{
  items: { v: number | string; label: string }[];
  value: number | string;
  onSelect: (v: number | string) => void;
  unit: string;
}> = ({ items, value, onSelect, unit }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = items.findIndex(i => i.v === value);
    if (idx >= 0) el.scrollTo({ top: idx * ITEM_H });
  }, [value, items]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    const item = items[clamped];
    if (item && item.v !== value) onSelect(item.v);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="h-5 flex items-center justify-center text-[10px] font-bold text-stone-400 mb-1">{unit}</div>
      <div ref={ref} onScroll={handleScroll} className="relative h-56 overflow-y-auto no-scrollbar snap-y snap-mandatory py-22">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-12 bg-amber-500/10 border-y border-amber-500/20 pointer-events-none z-10"></div>
        {items.map((it, i) => (
          <div
            key={i}
            data-idx={i}
            onClick={() => onSelect(it.v)}
            className={`h-12 flex items-center justify-center snap-center text-sm md:text-base transition-all cursor-pointer select-none ${it.v === value ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-400 hover:text-stone-600'}`}
          >
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const DIRECT_STEPS = ['yearGan', 'yearZhi', 'month', 'dayGan', 'dayZhi', 'hour'] as const;
type DirectStep = (typeof DIRECT_STEPS)[number];
type DirectKey = 'yearGan' | 'yearZhi' | 'monthGan' | 'monthZhi' | 'dayGan' | 'dayZhi' | 'hourGan' | 'hourZhi';
type PillarKey = 'year' | 'month' | 'day' | 'hour';

const STEP_PILLAR: Record<DirectStep, PillarKey> = {
  yearGan: 'year', yearZhi: 'year', month: 'month',
  dayGan: 'day', dayZhi: 'day', hour: 'hour',
};

const YANG_BRANCHES = ['子', '寅', '辰', '午', '申', '戌'];
const YIN_BRANCHES = ['丑', '卯', '巳', '未', '酉', '亥'];

const isYangStem = (s: string): boolean => HEAVENLY_STEMS.indexOf(s) % 2 === 0;
const branchesForStem = (s: string): string[] => (isYangStem(s) ? YANG_BRANCHES : YIN_BRANCHES);

// 五虎遁：以年干推寅月天干为起点，地支寅→丑顺排，天干逐月+1
const monthPillarList = (yearGan: string): { gan: string; zhi: string }[] => {
  let stemIdx = HEAVENLY_STEMS.indexOf(getMonthStem(yearGan, '寅'));
  return MONTH_BRANCHES.map(zhi => {
    const gan = HEAVENLY_STEMS[stemIdx];
    stemIdx = (stemIdx + 1) % 10;
    return { gan, zhi };
  });
};

// 五鼠遁：以日干推子时天干为起点，地支子→亥顺排，天干逐时+1
const hourPillarList = (dayGan: string): { gan: string; zhi: string }[] => {
  let stemIdx = HEAVENLY_STEMS.indexOf(getHourStem(dayGan, '子'));
  return EARTHLY_BRANCHES.map(zhi => {
    const gan = HEAVENLY_STEMS[stemIdx];
    stemIdx = (stemIdx + 1) % 10;
    return { gan, zhi };
  });
};

// 干支五行配色
const charColor = (char: string, isStem: boolean) => {
  const element = isStem ? STEM_ELEMENTS[char] : BRANCH_ELEMENTS[char];
  return ELEMENT_COLORS[element] || ELEMENT_COLORS.default;
};

const DateTimePickerModal: React.FC<{
  isOpen: boolean;
  initialTab: CalendarType;
  initialSolar: SolarDT;
  initialLunar: LunarDT;
  initialDirect: DirectDT;
  sect: 1 | 2;
  onClose: () => void;
  onConfirm: (tab: CalendarType, solar: SolarDT, lunar: LunarDT, direct: DirectDT) => void;
}> = ({ isOpen, initialTab, initialSolar, initialLunar, initialDirect, sect, onClose, onConfirm }) => {
  const [tab, setTab] = useState<CalendarType>(initialTab);
  const [solar, setSolar] = useState<SolarDT>(initialSolar);
  const [lunar, setLunar] = useState<LunarDT>(initialLunar);
  const [direct, setDirect] = useState<DirectDT>(initialDirect);
  const [solarInput, setSolarInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [directStep, setDirectStep] = useState(0);
  // 四柱选齐后默认隐藏步骤选择区；点击总览格跳回某步时进入“编辑”态重新显示
  const [directEditing, setDirectEditing] = useState(false);
  // 匹配时间列表可选项（按 ymd-hms 字符串记录，重选四柱匹配变化时回退第一项）
  const [selectedMatchKey, setSelectedMatchKey] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setSolar(initialSolar);
      setLunar(initialLunar);
      setDirect(initialDirect);
      setSolarInput('');
      setInputError('');
      setDirectStep(0);
      setDirectEditing(false);
      const prevMs = initialDirect.matchedSolar;
      setSelectedMatchKey(prevMs ? `${prevMs.year}-${pad2(prevMs.month)}-${pad2(prevMs.day)} ${pad2(prevMs.hour)}:${pad2(prevMs.minute)}:00` : '');
    }
  }, [isOpen, initialTab, initialSolar, initialLunar, initialDirect]);

  const solarMaxDay = new Date(solar.year, solar.month, 0).getDate();
  useEffect(() => {
    if (solar.day > solarMaxDay) setSolar(s => ({ ...s, day: solarMaxDay }));
  }, [solar.year, solar.month, solarMaxDay]);

  // 农历年变化时，若闰月不存在则回退到正月
  useEffect(() => {
    const months = buildLunarMonths(lunar.year);
    if (!months.some(m => m.v === (lunar.leap ? -lunar.month : lunar.month))) {
      setLunar(l => ({ ...l, month: 1, leap: false }));
    }
  }, [lunar.year]);

  const lunarMonths = useMemo(() => buildLunarMonths(lunar.year), [lunar.year]);
  const lunarMonthVal = lunar.leap ? -lunar.month : lunar.month;
  const lunarDayCount = LunarMonth.fromYm(lunar.year, lunarMonthVal)?.getDayCount() ?? 30;
  useEffect(() => {
    if (lunar.day > lunarDayCount) setLunar(l => ({ ...l, day: lunarDayCount }));
  }, [lunar.year, lunar.month, lunar.leap, lunarDayCount]);

  const switchTab = (t: CalendarType) => {
    if (t === tab) return;
    if (t === CalendarType.SOLAR) {
      setSolar(lunarToSolar(lunar));
    } else if (t === CalendarType.LUNAR) {
      setLunar(solarToLunar(solar));
    }
    setTab(t);
    setInputError('');
  };

  const parseSolarInput = () => {
    const digits = solarInput.replace(/\D/g, '');
    if (digits.length !== 12) {
      setInputError('格式应为 12 位数字：YYYYMMDDHHMM，如 199101010255');
      return;
    }
    const y = parseInt(digits.slice(0, 4), 10);
    const m = parseInt(digits.slice(4, 6), 10);
    const d = parseInt(digits.slice(6, 8), 10);
    const h = parseInt(digits.slice(8, 10), 10);
    const min = parseInt(digits.slice(10, 12), 10);
    if (m < 1 || m > 12 || h > 23 || min > 59 || y < YEAR_MIN || y > YEAR_MAX) {
      setInputError('时间不合法，请检查年月日时分');
      return;
    }
    const max = new Date(y, m, 0).getDate();
    if (d < 1 || d > max) {
      setInputError('日期不合法，该月没有这一天');
      return;
    }
    setSolar({ year: y, month: m, day: d, hour: h, minute: min });
    setSolarInput('');
    setInputError('');
  };

  // 只写入当前步骤的选择，不自动填充后续干支：严格按顺序选，避免年支/月柱“自动出来”
  // 若重选年干/日干（值发生变化），则清空依赖它的字段，强制重新选择
  const pickDirect = (step: DirectStep, v: string) => {
    setDirect(prev => {
      const next = { ...prev } as DirectDT;
      if (step === 'yearGan') {
        next.yearGan = v;
        if (v !== prev.yearGan) {
          next.yearZhi = '';
          next.monthGan = '';
          next.monthZhi = '';
        }
      } else if (step === 'yearZhi') {
        next.yearZhi = v;
      } else if (step === 'month') {
        next.monthGan = v[0];
        next.monthZhi = v[1];
      } else if (step === 'dayGan') {
        next.dayGan = v;
        if (v !== prev.dayGan) {
          next.dayZhi = '';
          next.hourGan = '';
          next.hourZhi = '';
        }
      } else if (step === 'dayZhi') {
        next.dayZhi = v;
      } else if (step === 'hour') {
        next.hourGan = v[0];
        next.hourZhi = v[1];
      }
      return next;
    });
    const stepIdx = DIRECT_STEPS.indexOf(step);
    if (stepIdx >= 0) setDirectStep((stepIdx + 1) % DIRECT_STEPS.length);
    setDirectEditing(false);
  };

  const isDirectComplete = !!(direct.yearGan && direct.yearZhi && direct.monthGan && direct.monthZhi && direct.dayGan && direct.dayZhi && direct.hourGan && direct.hourZhi);
  // 四柱选齐后只保留匹配时间；点击总览格跳回时进入编辑态重新展示选项
  const directPickerVisible = !isDirectComplete || directEditing;
  const matches = useMemo(() => {
    if (!isDirectComplete) return [] as Solar[];
    return findAllSolarDatesFromBaZi(
      direct.yearGan + direct.yearZhi,
      direct.monthGan + direct.monthZhi,
      direct.dayGan + direct.dayZhi,
      direct.hourGan + direct.hourZhi,
      sect
    );
  }, [isDirectComplete, direct, sect]);

  // 匹配时间列表可选择：默认第一项；重选四柱后匹配变化时回退到第一项
  const selectedMatchIndex = matches.findIndex((m) => m.toYmdHms() === selectedMatchKey);
  const effectiveMatchIndex = matches.length > 0 && selectedMatchIndex < 0 ? 0 : selectedMatchIndex;
  const selectedSolar = matches[effectiveMatchIndex];
  const confirmDirect = () => {
    const { matchedSolar: _old, ...rest } = direct;
    const next: DirectDT = selectedSolar
      ? { ...rest, matchedSolar: { year: selectedSolar.getYear(), month: selectedSolar.getMonth(), day: selectedSolar.getDay(), hour: selectedSolar.getHour(), minute: selectedSolar.getMinute() } }
      : rest;
    onConfirm(tab, solar, lunar, next);
  };

  if (!isOpen) return null;

  const solarMonthItems = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, label: pad2(i + 1) }));
  const solarDayItems = Array.from({ length: solarMaxDay }, (_, i) => ({ v: i + 1, label: pad2(i + 1) }));
  const solarHourItems = Array.from({ length: 24 }, (_, i) => ({ v: i, label: pad2(i) }));
  const solarMinuteItems = Array.from({ length: 60 }, (_, i) => ({ v: i, label: pad2(i) }));
  const lunarDayItems = Array.from({ length: lunarDayCount }, (_, i) => ({ v: i + 1, label: LUNAR_DAY_NAMES[i] || String(i + 1) }));

  const stepLabel = DIRECT_STEPS[directStep];
  const currentStepPillar = STEP_PILLAR[stepLabel];
  const jumpToStep = (step: DirectStep) => {
    const idx = DIRECT_STEPS.indexOf(step);
    if (idx >= 0) {
      setDirectStep(idx);
      setDirectEditing(true);
    }
  };

  const clearDirect = () => {
    setDirect({ yearGan: '', yearZhi: '', monthGan: '', monthZhi: '', dayGan: '', dayZhi: '', hourGan: '', hourZhi: '' });
    setDirectStep(0);
    setDirectEditing(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#fdfcf8] w-full max-w-lg rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up border-t border-stone-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button onClick={onClose} className="text-stone-400 text-xl font-bold hover:text-stone-600 transition-colors">取消</button>
          <div className="w-8"></div>
        </div>

        {/* 模式 Tab：公历 / 农历 / 四柱 可自由切换 */}
        <div className="px-6 pb-3">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            {[
              { t: CalendarType.SOLAR, l: '公历' },
              { t: CalendarType.LUNAR, l: '农历' },
              { t: CalendarType.DIRECT, l: '四柱' },
            ].map(item => (
              <button
                key={item.t}
                type="button"
                onClick={() => switchTab(item.t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === item.t ? 'bg-[#b39b7d] text-white shadow-md' : 'text-stone-400 hover:text-stone-500'}`}
              >
                {item.l}
              </button>
            ))}
          </div>
        </div>

        {tab === CalendarType.SOLAR && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-stone-100 rounded-xl px-3 py-2 mb-1">
              <input
                type="text"
                inputMode="numeric"
                placeholder="公历直接输入：199101010255（年月日时分）"
                value={solarInput}
                onChange={(e) => { setSolarInput(e.target.value); setInputError(''); }}
                className="flex-1 min-w-0 bg-transparent outline-none text-xs md:text-sm text-stone-700 font-bold placeholder:text-stone-300"
              />
              <button
                type="button"
                onClick={parseSolarInput}
                className="shrink-0 px-4 py-1.5 bg-[#2b2320] text-white rounded-lg text-xs font-bold active:scale-95 transition-all"
              >
                确定
              </button>
            </div>
            {inputError && <p className="text-[10px] text-rose-500 font-bold px-1 mb-1">{inputError}</p>}
            <div className="flex border-t border-stone-100 pt-2">
              <WheelColumn items={YEAR_ITEMS} value={solar.year} onSelect={(v) => setSolar(s => ({ ...s, year: v as number }))} unit="年" />
              <WheelColumn items={solarMonthItems} value={solar.month} onSelect={(v) => setSolar(s => ({ ...s, month: v as number }))} unit="月" />
              <WheelColumn items={solarDayItems} value={solar.day} onSelect={(v) => setSolar(s => ({ ...s, day: v as number }))} unit="日" />
              <WheelColumn items={solarHourItems} value={solar.hour} onSelect={(v) => setSolar(s => ({ ...s, hour: v as number }))} unit="时" />
              <WheelColumn items={solarMinuteItems} value={solar.minute} onSelect={(v) => setSolar(s => ({ ...s, minute: v as number }))} unit="分" />
            </div>
          </div>
        )}

        {tab === CalendarType.LUNAR && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-stone-400 font-bold px-1 py-1.5">农历日期（闰月自动出现在月份列中）</p>
            <div className="flex border-t border-stone-100 pt-2">
              <WheelColumn items={YEAR_ITEMS} value={lunar.year} onSelect={(v) => setLunar(l => ({ ...l, year: v as number }))} unit="年" />
              <WheelColumn items={lunarMonths} value={lunarMonthVal} onSelect={(v) => setLunar(l => ({ ...l, month: Math.abs(v as number), leap: (v as number) < 0 }))} unit="月" />
              <WheelColumn items={lunarDayItems} value={lunar.day} onSelect={(v) => setLunar(l => ({ ...l, day: v as number }))} unit="日" />
              <WheelColumn items={solarHourItems} value={lunar.hour} onSelect={(v) => setLunar(l => ({ ...l, hour: v as number }))} unit="时" />
              <WheelColumn items={solarMinuteItems} value={lunar.minute} onSelect={(v) => setLunar(l => ({ ...l, minute: v as number }))} unit="分" />
            </div>
          </div>
        )}

        {tab === CalendarType.DIRECT && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">四柱录入</span>
            </div>

            {/* 四柱总览：点击任意干/支格可跳回该步骤 */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {(['year', 'month', 'day', 'hour'] as const).map((p, colIdx) => {
                const label = ['年柱', '月柱', '日柱', '时柱'][colIdx];
                const ganKey = `${p}Gan` as DirectKey;
                const zhiKey = `${p}Zhi` as DirectKey;
                const gStep: DirectStep = p === 'year' ? 'yearGan' : p === 'month' ? 'month' : p === 'day' ? 'dayGan' : 'hour';
                const zStep: DirectStep = p === 'year' ? 'yearZhi' : p === 'month' ? 'month' : p === 'day' ? 'dayZhi' : 'hour';
                const active = currentStepPillar === p;
                const cellCls = (char: string, isStem: boolean, isActive: boolean) => {
                  const c = charColor(char, isStem);
                  return `w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border-2 text-lg md:text-xl font-bold transition-all select-none ${c.bg} ${c.border} ${c.text} ${
                    isActive ? 'ring-2 ring-amber-400/70 shadow-sm' : ''
                  }`;
                };
                return (
                  <div key={p} className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 pt-2 transition-all ${
                    active ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-300' : 'border-stone-200/70 bg-white'
                  }`}>
                    <span className={`text-[10px] font-bold tracking-wider ${active ? 'text-amber-700' : 'text-stone-400'}`}>{label}</span>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => jumpToStep(gStep)} className={cellCls((direct as any)[ganKey], true, stepLabel === gStep)}>
                        {(direct as any)[ganKey] || ''}
                      </button>
                      <button type="button" onClick={() => jumpToStep(zStep)} className={cellCls((direct as any)[zhiKey], false, stepLabel === zStep)}>
                        {(direct as any)[zhiKey] || ''}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 查找范围 + 清除 */}
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-sm font-bold text-stone-500">查找范围：1900-2100</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmDirect}
                  disabled={!isDirectComplete}
                  className={`flex items-center gap-1 text-sm font-bold px-4 py-1.5 rounded-full active:scale-95 transition-all ${
                    isDirectComplete ? 'text-white bg-[#2b2320] border border-[#2b2320] shadow' : 'text-stone-400 bg-stone-100 border border-stone-200'
                  }`}
                >
                  确认
                </button>
                <button
                  type="button"
                  onClick={clearDirect}
                  className="flex items-center gap-1 text-sm font-bold text-rose-500 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full active:scale-95 transition-all"
                >
                  清除
                </button>
              </div>
            </div>

            {/* 当前步骤选择区：四柱选齐后隐藏，只保留匹配时间列表 */}
            {directPickerVisible && (<>
            {(stepLabel === 'yearGan' || stepLabel === 'dayGan') && (
              (() => {
                if (stepLabel === 'dayGan' && !(direct.monthGan && direct.monthZhi)) {
                  return (
                    <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-6 text-center text-xs font-bold text-stone-400">请先选择月柱，再选择日柱天干</div>
                  );
                }
                return (
                  <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                    <div className="text-center text-[10px] font-bold text-stone-400 mb-2">选择天干</div>
                    <div className="grid grid-cols-5 gap-2">
                      {HEAVENLY_STEMS.map(s => {
                        const sel = s === (direct as any)[stepLabel];
                        const c = charColor(s, true);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => pickDirect(stepLabel, s)}
                            className={`h-12 rounded-xl border text-lg font-bold transition-all active:scale-95 select-none ${
                              sel ? 'border-[#2b2320] bg-[#2b2320] text-white shadow' : `${c.bg} ${c.border} ${c.text}`
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {(stepLabel === 'yearZhi' || stepLabel === 'dayZhi') && (
              (() => {
                const stem = stepLabel === 'yearZhi' ? direct.yearGan : direct.dayGan;
                if (!stem) {
                  return (
                    <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-6 text-center text-xs font-bold text-stone-400">
                      请先选择{stepLabel === 'yearZhi' ? '年柱天干' : '日柱天干'}，再选择地支
                    </div>
                  );
                }
                const options = branchesForStem(stem);
                return (
                  <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                    <div className="text-center text-[10px] font-bold text-stone-400 mb-2">{isYangStem(stem) ? '阳干配阳支' : '阴干配阴支'} · 选择地支</div>
                    <div className="grid grid-cols-3 gap-2">
                      {options.map(b => {
                        const sel = b === (direct as any)[stepLabel];
                        const c = charColor(b, false);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => pickDirect(stepLabel, b)}
                            className={`h-12 rounded-xl border text-lg font-bold transition-all active:scale-95 select-none ${
                              sel ? 'border-[#2b2320] bg-[#2b2320] text-white shadow' : `${c.bg} ${c.border} ${c.text}`
                            }`}
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {stepLabel === 'month' && (
              (() => {
                if (!direct.yearZhi) {
                  return (
                    <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-6 text-center text-xs font-bold text-stone-400">请先选择年柱地支，再选择月柱</div>
                  );
                }
                return (
                  <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                    <div className="text-center text-[10px] font-bold text-stone-400 mb-2">十二个月柱 · 按五虎遁推算</div>
                    <div className="grid grid-cols-6 gap-2">
                      {monthPillarList(direct.yearGan).map(p => {
                        const sel = p.gan === direct.monthGan && p.zhi === direct.monthZhi;
                        const gc = charColor(p.gan, true);
                        const zc = charColor(p.zhi, false);
                        return (
                          <button
                            key={p.gan + p.zhi}
                            type="button"
                            onClick={() => pickDirect('month', p.gan + p.zhi)}
                            className={`h-12 rounded-xl border text-base font-bold transition-all active:scale-95 select-none ${
                              sel ? 'border-[#2b2320] bg-[#2b2320] text-white shadow' : 'border-stone-200 bg-white text-stone-600'
                            }`}
                          >
                            <span className={sel ? 'text-white' : gc.text}>{p.gan}</span><span className={sel ? 'text-white' : zc.text}>{p.zhi}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}

            {stepLabel === 'hour' && (
              (() => {
                if (!direct.dayZhi) {
                  return (
                    <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-6 text-center text-xs font-bold text-stone-400">请先选择日柱地支，再选择时柱</div>
                  );
                }
                return (
                  <div className="rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                    <div className="text-center text-[10px] font-bold text-stone-400 mb-2">十二个时柱 · 按五鼠遁推算</div>
                    <div className="grid grid-cols-6 gap-2">
                      {hourPillarList(direct.dayGan).map(p => {
                        const sel = p.gan === direct.hourGan && p.zhi === direct.hourZhi;
                        const gc = charColor(p.gan, true);
                        const zc = charColor(p.zhi, false);
                        return (
                          <button
                            key={p.gan + p.zhi}
                            type="button"
                            onClick={() => pickDirect('hour', p.gan + p.zhi)}
                            className={`h-12 rounded-xl border text-base font-bold transition-all active:scale-95 select-none ${
                              sel ? 'border-[#2b2320] bg-[#2b2320] text-white shadow' : 'border-stone-200 bg-white text-stone-600'
                            }`}
                          >
                            <span className={sel ? 'text-white' : gc.text}>{p.gan}</span><span className={sel ? 'text-white' : zc.text}>{p.zhi}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            )}
            </>)}

            {/* 匹配时间列表：四柱选齐且未进入编辑态时显示 */}
            {isDirectComplete && !directEditing && (
              <div className="mt-3 rounded-2xl bg-stone-50/80 border border-stone-100 p-3">
                <div className="text-center text-xs font-bold text-stone-500 mb-2">匹配时间（1900-2100）</div>
                {matches.length === 0 ? (
                  <div className="text-center text-xs text-stone-400 py-3">范围内无匹配时间</div>
                ) : (
                  <div className="max-h-52 overflow-y-auto no-scrollbar space-y-1.5">
                    {matches.map((m, i) => {
                      const l = m.getLunar();
                      const isSelected = effectiveMatchIndex === i;
                      return (
                        <button
                          key={m.toYmdHms()}
                          type="button"
                          onClick={() => setSelectedMatchKey(m.toYmdHms())}
                          className={`w-full text-left flex flex-col gap-0.5 rounded-lg border px-3 py-2 transition-all active:scale-[0.99] ${
                            isSelected ? 'border-[#b39b7d] bg-[#b39b7d] text-white shadow' : 'bg-white border-stone-100 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-stone-700'}`}>阳历：{m.toYmdHms().slice(0, 16)}</span>
                            {isSelected && <span className="text-[10px] font-bold text-white">已选 ✓</span>}
                          </div>
                          <div className={`text-[11px] ${isSelected ? 'text-white/90' : 'text-stone-500'}`}>阴历：{l.getYearInChinese()}年{l.getMonthInChinese()}月{l.getDayInChinese()} {l.getTimeZhi()}时</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-5 bg-white border-t border-stone-100">
          <button
            onClick={confirmDirect}
            className="w-full py-4 bg-[#2b2320] text-white rounded-full text-lg font-bold shadow-lg active:scale-95 transition-all"
          >
            确定
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const BaziClock: React.FC<{ time: Date }> = ({ time }) => {
  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();
  const hourRotation = (hour % 12 + minute / 60) * 30;
  const minuteRotation = (minute + second / 60) * 6;

  return (
    <div className="relative w-12 h-12 md:w-16 md:h-16 border border-stone-200 rounded-full flex items-center justify-center bg-[#fdfcf8] shadow-inner shrink-0">
       {[0, 90, 180, 270].map((deg) => (
         <div key={deg} className="absolute w-0.5 h-0.5 md:h-1 bg-stone-300 rounded-full" style={{ transform: `rotate(${deg}deg) translateY(-22px)` }} />
       ))}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute bg-[#2b2320] rounded-full transition-transform duration-500 ease-out origin-bottom" style={{ width: '1.5px', height: '10px', bottom: '50%', transform: `rotate(${hourRotation}deg)`, marginBottom: '-1px' }} />
          <div className="absolute bg-stone-400 rounded-full transition-transform duration-500 ease-out origin-bottom" style={{ width: '1px', height: '16px', bottom: '50%', transform: `rotate(${minuteRotation}deg)`, marginBottom: '-1px' }} />
       </div>
       <div className="relative w-1 h-1 bg-[#2b2320] rounded-full z-20 border-2 border-white"></div>
    </div>
  );
};

const CharacterBlock: React.FC<{ char: string; isStem: boolean }> = ({ char, isStem }) => {
  const element = isStem ? STEM_ELEMENTS[char] : BRANCH_ELEMENTS[char];
  const color = ELEMENT_COLORS[element] || ELEMENT_COLORS.default;
  return (
    <div className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-md border text-sm md:text-lg font-bold shadow-sm ${color.bg} ${color.border} ${color.text}`}>
      {char}
    </div>
  );
};

const InputForm: React.FC<InputFormProps> = React.memo(({ onCalculate }) => {
  const { showToast } = useToast();
  const { isAuthenticated, preferences, updatePreferences } = useUserAuth();
  const appliedPrefsRef = useRef('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [calendarType, setCalendarType] = useState<CalendarType>(CalendarType.SOLAR);
  const [solarDt, setSolarDt] = useState<SolarDT>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
  });
  const [lunarDt, setLunarDt] = useState<LunarDT>(() => solarToLunar({
    year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate(), hour: new Date().getHours(), minute: new Date().getMinutes()
  }));
  const [directData, setDirectData] = useState<DirectDT>({
    yearGan: '', yearZhi: '',
    monthGan: '', monthZhi: '',
    dayGan: '', dayZhi: '',
    hourGan: '', hourZhi: ''
  });
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(true);
  const [longitude, setLongitude] = useState('116.42');
  const [latitude, setLatitude] = useState('39.93');
  const [locationName, setLocationName] = useState('北京市 东城区');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timezoneOffset, setTimezoneOffset] = useState('8');
  const [sect, setSect] = useState<1 | 2>(2);
  const [manualLongitude, setManualLongitude] = useState('');
  const [useManualLongitude, setUseManualLongitude] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 登录后应用云端排盘配置回填表单（偏好变化时重新应用一次）
  useEffect(() => {
    if (!isAuthenticated) return;
    const key = JSON.stringify(preferences);
    if (appliedPrefsRef.current === key) return;
    appliedPrefsRef.current = key;
    applyPreferences(preferences, {
      setGender,
      setCalendarType,
      setTimezoneOffset,
      setSect,
      setUseTrueSolarTime,
      setUseManualLongitude,
      setManualLongitude,
      setLocationName,
      setLongitude,
      setLatitude,
    });
  }, [isAuthenticated, preferences]);

  const buildPreferences = useCallback((): Record<string, unknown> => ({
    gender,
    calendarType,
    useTrueSolarTime,
    timezoneOffset,
    sect,
    useManualLongitude,
    manualLongitude,
    locationName,
    longitude,
    latitude,
  }), [gender, calendarType, useTrueSolarTime, timezoneOffset, sect, useManualLongitude, manualLongitude, locationName, longitude, latitude]);

  // BaziClock 每秒走针，但四柱预览无需每秒重算：按分钟变化惰性计算，避免每秒重建 Solar+Lunar+EightChar
  const currentMinuteKey = Math.floor(currentTime.getTime() / 60000);
  const currentInfo = useMemo(() => {
    const s = Solar.fromDate(currentTime);
    const l = s.getLunar();
    const ec = l.getEightChar();
    return {
      pillars: [
        { gan: ec.getYearGan(), zhi: ec.getYearZhi(), label: '年' },
        { gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), label: '月' },
        { gan: ec.getDayGan(), zhi: ec.getDayZhi(), label: '日' },
        { gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), label: '时' }
      ],
      lunarText: `${l.getYearInGanZhi()}年${l.getMonthInChinese()}月${l.getDayInChinese()} ${l.getTimeZhi()}时`,
      solarText: `${s.toYmdHms()}`
    };
  }, [currentMinuteKey]);

  const dateSummary = useMemo(() => {
    if (calendarType === CalendarType.SOLAR) {
      return `${solarDt.year}-${pad2(solarDt.month)}-${pad2(solarDt.day)} ${pad2(solarDt.hour)}:${pad2(solarDt.minute)}`;
    }
    if (calendarType === CalendarType.LUNAR) {
      const l = Lunar.fromYmdHms(lunarDt.year, lunarDt.leap ? -lunarDt.month : lunarDt.month, lunarDt.day, lunarDt.hour, lunarDt.minute, 0);
      return `${l.getYearInGanZhi()}年 ${l.getMonthInChinese()}月 ${l.getDayInChinese()} ${l.getTimeZhi()}时`;
    }
    const dChar = (c: string, isStem: boolean) => {
      const col = charColor(c, isStem);
      return <span className={`font-bold ${col.text}`}>{c}</span>;
    };
    return (
      <span className="inline-flex items-center whitespace-nowrap">
        <span>{dChar(directData.yearGan, true)}{dChar(directData.yearZhi, false)}年 </span>
        <span>{dChar(directData.monthGan, true)}{dChar(directData.monthZhi, false)}月 </span>
        <span>{dChar(directData.dayGan, true)}{dChar(directData.dayZhi, false)}日 </span>
        <span>{dChar(directData.hourGan, true)}{dChar(directData.hourZhi, false)}时</span>
      </span>
    );
  }, [calendarType, solarDt, lunarDt, directData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calendarType === CalendarType.DIRECT && (!directData.yearGan || !directData.yearZhi || !directData.monthGan || !directData.monthZhi || !directData.dayGan || !directData.dayZhi || !directData.hourGan || !directData.hourZhi)) {
      showToast('请先完成四柱选择');
      return;
    }
    setIsCalculating(true);
    // 手动经度优先，否则用地点经度
    const finalLongitude = useManualLongitude && manualLongitude.trim() !== '' ? parseFloat(manualLongitude) : (parseFloat(longitude) || 120.0);
    let input: Record<string, unknown>;
    if (calendarType === CalendarType.SOLAR) {
      input = { year: solarDt.year, month: solarDt.month, day: solarDt.day, hour: solarDt.hour, minute: solarDt.minute, type: calendarType };
    } else if (calendarType === CalendarType.LUNAR) {
      input = { year: lunarDt.year, month: lunarDt.leap ? -lunarDt.month : lunarDt.month, day: lunarDt.day, hour: lunarDt.hour, minute: lunarDt.minute, type: calendarType };
    } else {
      input = { year: 0, month: 0, day: 0, hour: 0, minute: 0, type: calendarType, directData };
    }
    // 计算在 Web Worker 中进行，等待真实结果后关闭 loading
    try {
      const ok = await onCalculate({ ...input, name: name.trim() || undefined, gender, useTrueSolarTime, longitude: finalLongitude, timezoneOffset: parseFloat(timezoneOffset) || 8, sect });
      // 排盘成功后同步配置到云端
      if (ok && isAuthenticated) {
        updatePreferences(buildPreferences());
      }
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-8 max-w-2xl mx-auto animate-fade-in">
      <div className="bg-[#fdfcf8] rounded-[2rem] p-5 md:p-8 shadow-xl border border-stone-200/60 relative overflow-hidden">
        <div className="flex items-center gap-4 border-b border-stone-200/60 pb-2 mb-5 group">
          <User className="text-stone-300" size={20} />
          <input 
            type="text" 
            placeholder="姓名(可选)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-lg bg-transparent outline-none text-stone-800 placeholder:text-stone-200 font-serif font-bold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">性别</span>
               <div className="flex bg-stone-100 p-1 rounded-xl">
                  {[Gender.MALE, Gender.FEMALE].map(g => (
                    <button key={g} type="button" onClick={() => setGender(g)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${gender === g ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>
                      {g === Gender.MALE ? '乾造' : '坤造'}
                    </button>
                  ))}
               </div>
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">排盘模式</span>
               <div className="flex bg-stone-100 p-1 rounded-xl">
                  {[
                    {t: CalendarType.SOLAR, l: '公历'}, 
                    {t: CalendarType.LUNAR, l: '农历'},
                    {t: CalendarType.DIRECT, l: '四柱'}
                  ].map(item => (
                    <button key={item.t} type="button" onClick={() => { setCalendarType(item.t); setIsDatePickerOpen(true); }} className={`flex-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${calendarType === item.t ? 'bg-[#b39b7d] text-white shadow-md' : 'text-stone-400 hover:text-stone-500'}`}>
                      {item.l}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">出生日期</span>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="flex items-center justify-between bg-stone-100 p-2 rounded-xl text-stone-700 font-bold text-xs md:text-sm w-full group overflow-hidden border border-transparent hover:border-stone-200 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="text-stone-300 shrink-0" size={16} />
                  <span className="truncate">{dateSummary}</span>
                </div>
                <ChevronRight size={14} className="text-stone-300 shrink-0" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">出生地点</span>
                <button onClick={() => setIsPickerOpen(true)} className="flex items-center justify-between bg-stone-100 p-2 rounded-xl text-stone-700 font-bold text-xs md:text-sm w-full group overflow-hidden border border-transparent hover:border-stone-200 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="text-stone-300 shrink-0" size={16} />
                      <span className="truncate">{locationName}</span>
                    </div>
                    <ChevronRight size={14} className="text-stone-300" />
                </button>
                {longitude && latitude && (
                  <p className="text-[9px] text-stone-400 ml-1">
                    东经 {longitude}° · 北纬 {latitude}°
                  </p>
                )}
              </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-stone-100">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors">
            <SlidersHorizontal size={12} />
            高级设置
            <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between bg-stone-100 rounded-xl px-3 py-2.5">
                <div>
                  <span className="text-xs font-bold text-stone-700">真太阳时校正</span>
                  <p className="text-[9px] text-stone-400 mt-0.5">按出生经度与日期修正真太阳时</p>
                </div>
                <button type="button" onClick={() => setUseTrueSolarTime(!useTrueSolarTime)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${useTrueSolarTime ? 'bg-[#b39b7d]' : 'bg-stone-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${useTrueSolarTime ? 'left-[18px]' : 'left-0.5'}`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-stone-100 rounded-xl px-3 py-2.5">
                <div>
                  <span className="text-xs font-bold text-stone-700">出生时区</span>
                  <p className="text-[9px] text-stone-400 mt-0.5">当地钟表时间对应时区 (默认东八区)</p>
                </div>
                <select
                  value={timezoneOffset}
                  onChange={(e) => setTimezoneOffset(e.target.value)}
                  className="bg-white rounded-lg text-xs font-bold text-stone-700 px-2 py-1.5 border border-stone-200 focus:outline-none focus:border-[#b39b7d]"
                >
                  {TIMEZONE_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between bg-stone-100 rounded-xl px-3 py-2.5">
                <div>
                  <span className="text-xs font-bold text-stone-700">晚子时换日</span>
                  <p className="text-[9px] text-stone-400 mt-0.5">23:00-24:00 日柱与四柱按次日计算</p>
                </div>
                <button type="button" onClick={() => setSect(sect === 1 ? 2 : 1)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${sect === 1 ? 'bg-[#b39b7d]' : 'bg-stone-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sect === 1 ? 'left-[18px]' : 'left-0.5'}`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-stone-100 rounded-xl px-3 py-2.5">
                <div>
                  <span className="text-xs font-bold text-stone-700">手动经度</span>
                  <p className="text-[9px] text-stone-400 mt-0.5">留空则使用所选地点经度</p>
                </div>
                <button type="button" onClick={() => setUseManualLongitude(!useManualLongitude)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${useManualLongitude ? 'bg-[#b39b7d]' : 'bg-stone-300'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${useManualLongitude ? 'left-[18px]' : 'left-0.5'}`}></span>
                </button>
              </div>

              {useManualLongitude && (
                <input
                  type="number"
                  step="0.01"
                  placeholder="东经为正，如 116.42"
                  value={manualLongitude}
                  onChange={(e) => setManualLongitude(e.target.value)}
                  className="w-full bg-stone-100 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-700 border border-stone-200 focus:outline-none focus:border-[#b39b7d] placeholder:text-stone-300"
                />
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isCalculating}
          className="group relative w-full py-4 bg-[#2b2320] text-white rounded-xl text-lg font-bold tracking-[0.4em] shadow-lg overflow-hidden hover:shadow-xl active:scale-[0.99] transition-all mt-5 disabled:opacity-80 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          {isCalculating ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              计算中...
            </span>
          ) : (
            <span>开始排盘</span>
          )}
        </button>

        {/* 即时局预览 */}
        <div className="mt-6 pt-5 border-t border-stone-100">
           <div className="flex flex-row items-center justify-between w-full gap-2 md:gap-5 overflow-hidden whitespace-nowrap">
              <BaziClock time={currentTime} />
              <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="flex flex-row items-end justify-between w-full max-w-[240px] md:max-w-xs mb-2 px-1">
                    {currentInfo.pillars.map((p, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                         <span className="text-[9px] md:text-[10px] font-bold text-stone-400 leading-none">{p.label}</span>
                         <CharacterBlock char={p.gan} isStem={true} />
                         <CharacterBlock char={p.zhi} isStem={false} />
                      </div>
                    ))}
                  </div>
                  <div className="w-full text-center space-y-0.5 border-t border-stone-100/50 pt-1.5">
                     <p className="text-[9px] md:text-[10px] text-stone-500 font-bold truncate leading-none">
                       农历: {currentInfo.lunarText}
                     </p>
                     <p className="text-[8px] md:text-[10px] text-stone-400 font-medium truncate leading-none opacity-80">
                       公历: {currentInfo.solarText}
                     </p>
                  </div>
              </div>
           </div>
        </div>
      </div>

      <DateTimePickerModal
        isOpen={isDatePickerOpen}
        initialTab={calendarType}
        initialSolar={solarDt}
        initialLunar={lunarDt}
        initialDirect={directData}
        sect={sect}
        onClose={() => setIsDatePickerOpen(false)}
        onConfirm={(tab, s, l, d) => {
          setCalendarType(tab);
          setSolarDt(s);
          setLunarDt(l);
          setDirectData(d);
          setIsDatePickerOpen(false);
        }}
      />

      <LocationPickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)}
        onConfirm={(p, c, d, lng, lat) => {
          setLongitude(lng.toFixed(2));
          setLatitude(lat ? lat.toFixed(2) : '');
          setLocationName(`${p} ${c}`);
        }}
      />
    </div>
  );
});

export default InputForm;
