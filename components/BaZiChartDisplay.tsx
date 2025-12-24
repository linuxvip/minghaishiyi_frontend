
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BaZiChart, PillarData } from '../types';
import { ELEMENT_COLORS } from '../constants';
import { Calendar, AlertTriangle } from 'lucide-react';

interface BaZiChartDisplayProps {
  chart: BaZiChart;
}

const PillarCard: React.FC<{ title: string; data: PillarData; isDayMaster?: boolean }> = ({ title, data, isDayMaster }) => {
  const ganColor = ELEMENT_COLORS[data.ganElement] || ELEMENT_COLORS.default;
  const zhiColor = ELEMENT_COLORS[data.zhiElement] || ELEMENT_COLORS.default;

  return (
    <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 min-w-0">
      <div className="relative mb-0.5">
          <span className="text-stone-500 text-xs md:text-lg font-bold tracking-widest">{title}</span>
          {isDayMaster && <span className="absolute -top-1 -right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-600 rounded-full shadow-sm"></span>}
      </div>
      <span className="text-[10px] md:text-sm text-stone-400 h-4 md:h-5 flex items-center font-bold">{data.shiShen}</span>
      
      {/* 天干底框：减小圆角至 xl，防止字号较大时被裁切 */}
      <div className={`w-full aspect-square md:w-24 md:h-24 max-w-[70px] flex items-center justify-center rounded-xl border-2 text-2xl md:text-5xl font-bold shadow-sm transition-all ${ganColor.bg} ${ganColor.border} ${ganColor.text}`}>
        {data.gan}
      </div>
      
      {/* 地支底框：减小圆角至 xl */}
      <div className={`w-full aspect-square md:w-24 md:h-24 max-w-[70px] flex items-center justify-center rounded-xl border-2 text-2xl md:text-5xl font-bold shadow-sm transition-all ${zhiColor.bg} ${zhiColor.border} ${zhiColor.text}`}>
        {data.zhi}
      </div>
      
      <div className="flex flex-col items-center gap-0.5 mt-1 bg-stone-50/80 p-1 md:p-2 rounded-xl w-full border border-stone-100 shadow-inner">
        {data.cangGan.map((char, idx) => (
            <span key={idx} className="text-[10px] md:text-lg text-stone-700 font-bold leading-tight">{char}</span>
        ))}
      </div>
    </div>
  );
};

const BaZiChartDisplay: React.FC<BaZiChartDisplayProps> = ({ chart }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const luckRef = useRef<HTMLDivElement>(null);

  const [selectedLuckIdx, setSelectedLuckIdx] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);

  const solarDateStr = String(chart.solarDate || '');
  const isMatchingFailed = solarDateStr.includes('失败');

  useEffect(() => {
    const initialIdx = chart.luckPillars.findIndex(lp => currentYear >= lp.startYear && currentYear <= lp.endYear);
    setSelectedLuckIdx(initialIdx !== -1 ? initialIdx : 0);
    setSelectedYear(currentYear);
  }, [chart, currentYear]);

  return (
    // 减小整体容器圆角从 3xl 到 2xl，防止边缘内容在 mobile 上被大幅度切除
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden mt-0 md:mt-1 animate-fade-in relative mx-auto max-w-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-900 via-amber-700 to-rose-900"></div>
      
      {isMatchingFailed && (
        <div className="bg-rose-50 p-2 flex items-center gap-2 border-b border-rose-100">
           <AlertTriangle className="text-rose-600 shrink-0" size={16} />
           <p className="text-[10px] md:text-xs text-rose-800 font-bold">
             注意：输入组合在1900-2100年间无对应日期，以下排盘仅供参考。
           </p>
        </div>
      )}

      {/* Info Bar */}
      <div className="bg-stone-50 px-3 py-2 md:p-4 border-b border-stone-200 grid grid-cols-2 gap-2 text-[10px] md:text-sm leading-tight">
         <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
                <span className="text-stone-400">乾坤:</span>
                <span className="font-bold text-stone-800">{chart.gender}</span>
            </div>
            <div className="flex items-center gap-1.5">
                 <span className="text-stone-400">阳历:</span>
                 <span className={`${isMatchingFailed ? 'text-rose-500 font-bold' : 'text-stone-600'}`}>{solarDateStr}</span>
            </div>
         </div>
         <div className="text-right space-y-0.5">
            <div className="flex items-center gap-1.5 justify-end">
                 <span className="text-stone-400">阴历:</span>
                 <span className="font-bold text-stone-800">{chart.lunarDate}</span>
            </div>
             <div className="flex items-center gap-1.5 justify-end">
                 <span className="text-stone-400">气数:</span>
                 <span className="text-stone-500">{chart.jieQi}</span>
            </div>
         </div>
      </div>

      {/* Main Pillars */}
      <div className="p-4 md:p-10 bg-white relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
             <div className="w-48 h-48 md:w-72 md:h-72 border-[15px] md:border-[20px] border-black rounded-full"></div>
        </div>
        <div className="flex justify-between gap-1.5 md:gap-10 max-w-2xl mx-auto relative z-10">
           <PillarCard title="年柱" data={chart.year} />
           <PillarCard title="月柱" data={chart.month} />
           <PillarCard title="日柱" data={chart.day} isDayMaster={true} />
           <PillarCard title="时柱" data={chart.hour} />
        </div>
      </div>

      {/* Luck Display */}
      {chart.luckPillars.length > 0 ? (
        <div className="border-t border-stone-200 bg-[#fdfdfb] flex flex-col select-none">
             <div className="flex items-center justify-between py-1.5 px-3 bg-stone-50/50 border-b border-stone-100">
                <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs md:text-sm">
                  <Calendar size={14} />
                  <span>运限推演</span>
                </div>
                {selectedYear && (
                   <span className="text-[10px] md:text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                    {selectedYear}年
                  </span>
                )}
             </div>
            
            <div 
              ref={luckRef}
              className="flex w-full overflow-x-auto no-scrollbar bg-white"
            >
                {chart.luckPillars.map((lp, idx) => {
                    const isPreLuck = lp.type === 'PRE_LUCK';
                    const isCurrentDaYun = currentYear >= lp.startYear && currentYear <= lp.endYear;
                    const isSelectedLuck = selectedLuckIdx === idx;
                    
                    return (
                        <div 
                            key={idx} 
                            data-current={isCurrentDaYun ? "true" : "false"}
                            onClick={() => setSelectedLuckIdx(idx)}
                            // 增加最小宽度从 38px 到 40px，增加文字排版空间
                            className={`
                                flex-1 min-w-[40px] md:min-w-[75px] flex flex-col border-r border-stone-100 transition-all duration-200 cursor-pointer
                                ${isSelectedLuck ? 'bg-amber-50/40' : (isCurrentDaYun ? 'bg-amber-50/10' : 'bg-white')}
                                hover:bg-stone-50/50
                            `}
                        >
                            <div className={`
                                py-1.5 text-center border-b flex flex-col justify-center min-h-[45px] md:min-h-[80px] transition-colors
                                ${isSelectedLuck ? 'bg-amber-100/30' : (isCurrentDaYun ? 'bg-amber-50/20' : 'bg-stone-50/20')}
                            `}>
                                {isPreLuck ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] md:text-[9px] text-stone-400 font-bold">小运</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[7px] md:text-[10px] text-stone-300 font-mono">{lp.startYear}</span>
                                    <span className={`text-sm md:text-2xl font-bold leading-none ${isSelectedLuck || isCurrentDaYun ? 'text-amber-900' : 'text-stone-700'}`}>
                                        {lp.gan}{lp.zhi}
                                    </span>
                                    <span className="text-[7px] md:text-[10px] text-stone-400 mt-0.5">{lp.startAge}岁</span>
                                  </div>
                                )}
                            </div>

                            <div className="flex flex-col">
                                {lp.liuNian.map((ln, lnIdx) => {
                                    const isRealCurrentYear = ln.year === currentYear;
                                    const isUserSelectedYear = ln.year === selectedYear;
                                    return (
                                        <div 
                                            key={lnIdx}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedYear(ln.year);
                                              setSelectedLuckIdx(idx);
                                            }}
                                            // 优化内边距，确保文字在极窄列中仍能居中展示
                                            className={`
                                                flex justify-center items-center py-1.5 md:py-2 text-[10px] md:text-lg transition-all duration-200 border-b border-stone-50/50
                                                ${isUserSelectedYear 
                                                   ? 'bg-amber-500 text-white z-10 font-bold' 
                                                   : isRealCurrentYear 
                                                      ? 'bg-rose-800 text-white shadow-inner font-bold' 
                                                      : 'text-stone-500 hover:text-stone-900'}
                                            `}
                                        >
                                            <span className="tracking-tighter">{ln.gan}{ln.zhi}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      ) : null}
    </div>
  );
};

export default BaZiChartDisplay;
