
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Solar, Lunar, SolarMonth } from 'lunar-typescript';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { ELEMENT_COLORS, STEM_ELEMENTS, BRANCH_ELEMENTS, EARTHLY_BRANCHES } from '../constants';

const HuangLi: React.FC = () => {
  // 初始时间设为当前时刻，包含时分秒
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  const yearListRef = useRef<HTMLDivElement>(null);

  // 定时更新当前时间以保持“今”的时间点准确
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 当年份选择器打开时，自动将当前选中年滚动至中心
  useEffect(() => {
    if (isYearPickerOpen && yearListRef.current) {
      // 稍微延迟以确保 DOM 渲染完成
      const timer = setTimeout(() => {
        const selectedYearEl = yearListRef.current?.querySelector('[data-selected="true"]');
        if (selectedYearEl) {
          selectedYearEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isYearPickerOpen]);

  const data = useMemo(() => {
    const s = Solar.fromDate(selectedDate);
    const l = s.getLunar();
    const ec = l.getEightChar();
    
    // 获取当前选中时间对应的时辰分支
    const currentSelectedBranch = l.getTimeZhi();

    return {
      solar: s,
      lunar: l,
      ec,
      year: s.getYear(),
      month: s.getMonth(),
      day: s.getDay(),
      week: s.getWeekInChinese(),
      animal: l.getYearShengXiao(),
      lunarMonthName: l.getMonthInChinese(),
      lunarDayName: l.getDayInChinese(),
      lunarYearGZ: l.getYearInGanZhi(),
      currentSelectedBranch
    };
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const solarMonth = SolarMonth.fromYm(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
    return solarMonth.getDays();
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const selectYear = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    setIsYearPickerOpen(false);
  };

  const selectMonth = (month: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month - 1);
    setSelectedDate(newDate);
    setIsMonthPickerOpen(false);
  };

  // 点击地支更新时间
  const selectBranch = (branch: string) => {
    const branchToHour: Record<string, number> = {
      '子': 0, '丑': 2, '寅': 4, '卯': 6, '辰': 8, '巳': 10,
      '午': 12, '未': 14, '申': 16, '酉': 18, '戌': 20, '亥': 22
    };
    const newDate = new Date(selectedDate);
    newDate.setHours(branchToHour[branch]);
    newDate.setMinutes(0);
    setSelectedDate(newDate);
  };

  const isSelected = (d: Solar) => 
    d.getYear() === selectedDate.getFullYear() && 
    d.getMonth() === (selectedDate.getMonth() + 1) && 
    d.getDay() === selectedDate.getDate();

  const isToday = (d: Solar) => {
    const t = new Date();
    return d.getYear() === t.getFullYear() && 
           d.getMonth() === (t.getMonth() + 1) && 
           d.getDay() === t.getDate();
  };

  const renderPillar = (label: string, gan: string, zhi: string) => {
    const gElem = STEM_ELEMENTS[gan] || '';
    const zElem = BRANCH_ELEMENTS[zhi] || '';
    const gCol = ELEMENT_COLORS[gElem] || ELEMENT_COLORS.default;
    const zCol = ELEMENT_COLORS[zElem] || ELEMENT_COLORS.default;

    return (
      <div className="flex flex-col items-center">
        <span className="text-[10px] md:text-xs text-stone-400 font-bold mb-0.5">{label}</span>
        <span className={`text-xl md:text-2xl font-serif font-bold leading-tight ${gCol.text}`}>{gan}</span>
        <span className={`text-xl md:text-2xl font-serif font-bold leading-tight ${zCol.text}`}>{zhi}</span>
      </div>
    );
  };

  const years = useMemo(() => {
    const arr = [];
    for (let i = 1900; i <= 2100; i++) arr.push(i);
    return arr;
  }, []);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="max-w-xl mx-auto animate-fade-in px-2 md:px-4 pt-1 pb-4 md:py-4 select-none flex flex-col min-h-[calc(100vh-140px)] justify-center relative">
      
      {/* 顶部四柱与日期信息栏 */}
      <div className="bg-[#f2f0e9]/60 rounded-2xl md:rounded-[2rem] p-3 md:p-5 mb-2 md:mb-4 flex flex-row items-center justify-between shadow-sm border border-stone-200 gap-2">
        <div className="flex gap-2 md:gap-4 shrink-0">
          {renderPillar("年", data.ec.getYearGan(), data.ec.getYearZhi())}
          {renderPillar("月", data.ec.getMonthGan(), data.ec.getMonthZhi())}
          {renderPillar("日", data.ec.getDayGan(), data.ec.getDayZhi())}
          {renderPillar("时", data.ec.getTimeGan(), data.ec.getTimeZhi())}
        </div>
        
        <div className="flex flex-col items-end gap-1 md:gap-1.5 min-w-0 flex-1">
          <div className="text-right flex flex-col items-end w-full">
            <div className="flex items-baseline gap-1.5 justify-end w-full">
              <span className="text-sm md:text-lg font-bold text-stone-700 whitespace-nowrap">
                {data.year}.{data.month.toString().padStart(2, '0')}.{data.day.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] md:text-xs text-stone-500 font-bold">星期{data.week}</span>
            </div>
            <div className="text-[9px] md:text-xs font-serif font-bold text-[#8a1a1b] bg-rose-50/50 px-2 py-0.5 rounded-md border border-rose-100/50 mt-0.5">
              农历{data.lunarYearGZ} {data.lunarMonthName}月{data.lunarDayName} · {data.animal}
            </div>
          </div>
          <div className="bg-[#8a1a1b] text-white w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center text-xl md:text-2xl font-serif font-black shadow-lg shrink-0">
            {data.day}
          </div>
        </div>
      </div>

      {/* 日历主体卡片 */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col">
        {/* 月份导航 */}
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5 md:py-4 border-b border-stone-50">
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => changeMonth(-1)} className="text-stone-300 hover:text-stone-600 transition-colors p-1">
              <ChevronLeft size={22} className="md:w-8 md:h-8" />
            </button>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsYearPickerOpen(true)}
                className="text-2xl md:text-3xl font-serif font-black text-stone-800 tracking-tight hover:text-[#8a1a1b] transition-colors"
              >
                {data.year}年
              </button>
              <button 
                onClick={() => setIsMonthPickerOpen(true)}
                className="text-2xl md:text-3xl font-serif font-black text-stone-800 tracking-tight hover:text-[#8a1a1b] transition-colors"
              >
                {data.month}月
              </button>
            </div>
            <button onClick={() => changeMonth(1)} className="text-stone-300 hover:text-stone-600 transition-colors p-1">
              <ChevronRight size={22} className="md:w-8 md:h-8" />
            </button>
          </div>
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="w-8 h-8 md:w-10 md:h-10 bg-stone-50 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 transition-all border border-stone-100"
          >
            <CalendarIcon size={18} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* 顶部时辰分支条 */}
        <div className="flex justify-around py-1.5 md:py-2 px-2 md:px-4 bg-stone-50/50 border-b border-stone-50">
          {EARTHLY_BRANCHES.map(b => (
            <button 
              key={b} 
              onClick={() => selectBranch(b)}
              className={`
                w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[9px] md:text-xs font-bold transition-all
                ${data.currentSelectedBranch === b ? 'bg-[#8a1a1b] text-white shadow-md scale-110' : 'text-stone-400 border border-stone-100 bg-white hover:border-[#8a1a1b]/30'}
              `}
            >
              {b}
            </button>
          ))}
        </div>

        {/* 日历网格区域 */}
        <div className="flex-1 p-2 md:p-4">
          <div className="grid grid-cols-7 mb-1 md:mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((w, idx) => (
              <div key={w} className={`text-center py-1 text-[10px] md:text-xs font-bold ${idx === 0 || idx === 6 ? 'text-[#8a1a1b]' : 'text-stone-400'}`}>
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-stone-50">
            {Array.from({ length: monthDays[0].getWeek() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white aspect-[4/5]" />
            ))}

            {monthDays.map((d, i) => {
              const selected = isSelected(d);
              const today = isToday(d);
              const l = d.getLunar();
              const gz = l.getDayInGanZhi();
              const jq = l.getJieQi();
              const lunarDay = l.getDayInChinese();
              const isFirstDay = lunarDay === '初一';
              const isWeekend = d.getWeek() === 0 || d.getWeek() === 6;

              return (
                <button
                  key={i}
                  onClick={() => {
                    const newDate = new Date(d.getYear(), d.getMonth() - 1, d.getDay(), selectedDate.getHours(), selectedDate.getMinutes());
                    setSelectedDate(newDate);
                  }}
                  className={`
                    relative flex flex-col items-center justify-center aspect-[4/5] bg-white transition-all group overflow-hidden
                    ${selected ? 'z-10' : 'hover:bg-stone-50/50'}
                  `}
                >
                  {selected && (
                    <div className="absolute inset-1 bg-[#8a1a1b] rounded-lg shadow-lg"></div>
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className={`text-sm md:text-lg font-serif font-black leading-none mb-0.5 ${selected ? 'text-white' : (isWeekend ? 'text-[#8a1a1b]' : 'text-stone-800')}`}>
                      {d.getDay()}
                    </span>
                    <span className={`text-[8px] md:text-[9px] scale-90 leading-none mb-0.5 font-bold ${selected ? 'text-stone-300' : (jq ? 'text-[#8a1a1b]' : 'text-stone-400')}`}>
                      {jq || (isFirstDay ? l.getMonthInChinese() + '月' : lunarDay)}
                    </span>
                    <span className={`text-[9px] md:text-[11px] font-bold leading-none ${selected ? 'text-stone-400' : (jq ? 'text-[#8a1a1b]/70' : 'text-stone-300')}`}>
                      {gz}
                    </span>
                  </div>
                  {today && !selected && (
                    <div className="absolute top-1 right-1 w-0.5 h-0.5 md:w-1 md:h-1 bg-[#8a1a1b] rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* 底部备注 */}
      <div className="mt-3 md:mt-4 text-center px-4">
        <p className="text-[7px] md:text-[9px] font-bold text-stone-300 tracking-[0.2em] md:tracking-[0.3em] uppercase italic">
          Almanac Algorithm by MingHaiShiYi
        </p>
      </div>

      {/* 年份选择 Modal - 更新为垂直滚动样式 */}
      {isYearPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#fdfcf8] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up border border-stone-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <span className="text-lg font-bold text-stone-800">选择年份</span>
              <button onClick={() => setIsYearPickerOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={24} />
              </button>
            </div>
            {/* 纵向滚动容器 */}
            <div 
              ref={yearListRef}
              className="flex flex-col h-[50vh] overflow-y-auto no-scrollbar py-20 relative picker-mask"
            >
              <div className="flex flex-col items-center gap-1 py-10">
                {years.map(y => (
                  <button 
                    key={y} 
                    data-selected={data.year === y}
                    onClick={() => selectYear(y)}
                    className={`
                      w-full py-5 text-center transition-all flex items-center justify-center gap-4
                      ${data.year === y ? 'text-[#8a1a1b] font-black text-3xl scale-125' : 'text-stone-300 text-xl hover:text-stone-500'}
                    `}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-center italic text-[10px] text-stone-400 uppercase tracking-widest">
              上下滑动选择年份
            </div>
          </div>
        </div>
      )}

      {/* 月份选择 Modal */}
      {isMonthPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#fdfcf8] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up border border-stone-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <span className="text-lg font-bold text-stone-800">选择月份</span>
              <button onClick={() => setIsMonthPickerOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 p-8">
              {months.map(m => (
                <button 
                  key={m} 
                  onClick={() => selectMonth(m)}
                  className={`py-4 rounded-2xl text-lg font-bold transition-all ${data.month === m ? 'bg-[#8a1a1b] text-white shadow-md' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                >
                  {m}月
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HuangLi;
