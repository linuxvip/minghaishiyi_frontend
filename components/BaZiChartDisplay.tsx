
import React, { useMemo, useState } from 'react';
import { BaZiChart, PillarData, ShenShaItem, LuckPillar } from '../types';
import { ELEMENT_COLORS } from '../constants';
import { getElement, getShiShenByName, getXingYun, HIDE_STEMS, getNaYinByGanZhi, getXunKongByGanZhi } from '../utils/baziCalc';
import { AlertTriangle, Calendar } from 'lucide-react';

interface BaZiChartDisplayProps {
  chart: BaZiChart;
}

const elText = (el: string): string => (ELEMENT_COLORS[el] || ELEMENT_COLORS.default).text;

const endAgeOf = (lp: LuckPillar): number => lp.startAge + (lp.endYear - lp.startYear);

// 由任意干支构建展示用柱（流年/大运）
const flowPillar = (gan: string, zhi: string, dm: string): PillarData => ({
  gan, zhi,
  ganElement: getElement(gan), zhiElement: getElement(zhi),
  shiShen: getShiShenByName(dm, gan),
  cangGan: HIDE_STEMS[zhi] || [],
  cangGanShiShen: (HIDE_STEMS[zhi] || []).map(h => getShiShenByName(dm, h)),
  naYin: getNaYinByGanZhi(gan, zhi),
  xunKong: getXunKongByGanZhi(gan, zhi),
  xingYun: getXingYun(dm, zhi),
  ziZuo: getXingYun(gan, zhi),
});

const pillarPos: string[][] = [
  ['年干', '年支'],
  ['月干', '月支'],
  ['日干', '日支', '日柱'],
  ['时干', '时支'],
];

const shenShaNamesFor = (shenSha: ShenShaItem[] | undefined, idx: number): string[] =>
  (shenSha || []).filter(s => pillarPos[idx].includes(s.pos)).map(s => s.name);

type ColData = {
  label: string;
  sub?: string;
  data: PillarData | null;
  isDayMaster?: boolean;
  shenSha?: string[];
};

const GridCell: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`flex items-center justify-center text-center border-b border-r border-stone-200 px-0.5 py-1.5 min-h-[30px] ${className}`}>
    {children}
  </div>
);

const PillarGrid: React.FC<{ cols: ColData[]; showShenSha?: boolean; pro?: boolean; isMale?: boolean }> = ({ cols, showShenSha, pro, isMale }) => {
  const labelCol = pro ? '2rem' : '3rem';
  const gridCols = `grid border-stone-200`;
  const gridStyle = { gridTemplateColumns: `${labelCol} repeat(${cols.length}, 1fr)` };
  const big = pro ? 'text-base md:text-3xl' : 'text-2xl md:text-4xl';
  const stack = pro ? 'text-[8px] md:text-sm' : 'text-[10px] md:text-base';

  const rows: { label: string; cells: (c: ColData) => React.ReactNode }[] = [
    {
      label: '主星',
      cells: c => c.data ? (
        <span className={`text-[10px] md:text-sm font-bold tracking-widest rounded-full px-2 py-0.5 border ${
          c.isDayMaster
            ? isMale
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
            : 'text-stone-500 border-transparent'
        }`}>
          {c.isDayMaster ? (isMale ? '元男' : '元女') : c.data.shiShen}
        </span>
      ) : <span className="text-stone-300">—</span>,
    },
    {
      label: '天干',
      cells: c => c.data ? (
        <span className={`${big} font-bold leading-none ${elText(c.data.ganElement)}`}>{c.data.gan}</span>
      ) : <span className="text-stone-300">—</span>,
    },
    {
      label: '地支',
      cells: c => c.data ? (
        <span className={`${big} font-bold leading-none ${elText(c.data.zhiElement)}`}>{c.data.zhi}</span>
      ) : <span className="text-stone-300">—</span>,
    },
    {
      label: '藏干',
      cells: c => c.data ? (
        <span className="flex flex-col items-center leading-tight">
          {c.data.cangGan.map((h, i) => (
            <span key={i} className={`${stack} font-bold ${elText(getElement(h))}`}>{h}</span>
          ))}
        </span>
      ) : <span className="text-stone-300">—</span>,
    },
    {
      label: '副星',
      cells: c => c.data ? (
        <span className="flex flex-col items-center leading-tight">
          {c.data.cangGanShiShen.map((s, i) => (
            <span key={i} className={`${stack} text-stone-500 font-medium`}>{s}</span>
          ))}
        </span>
      ) : <span className="text-stone-300">—</span>,
    },
    {
      label: '星运',
      cells: c => c.data ? <span className={`${stack} text-stone-700 font-bold`}>{c.data.xingYun}</span> : <span className="text-stone-300">—</span>,
    },
    {
      label: '自坐',
      cells: c => c.data ? <span className={`${stack} text-stone-600 font-bold`}>{c.data.ziZuo}</span> : <span className="text-stone-300">—</span>,
    },
    {
      label: '空亡',
      cells: c => c.data ? <span className={`${stack} text-stone-500`}>{c.data.xunKong}</span> : <span className="text-stone-300">—</span>,
    },
    {
      label: '纳音',
      cells: c => c.data ? <span className={`${stack} text-stone-500`}>{c.data.naYin}</span> : <span className="text-stone-300">—</span>,
    },
  ];
  if (showShenSha) {
    rows.push({
      label: '神煞',
      cells: c => c.shenSha && c.shenSha.length > 0 ? (
        <span className="flex flex-wrap justify-center gap-x-1 gap-y-0.5">
          {c.shenSha.map((s, i) => (
            <span key={i} className={`font-bold text-amber-800 bg-amber-50 rounded px-1 py-px border border-amber-200/60 whitespace-nowrap ${pro ? 'text-[8px] md:text-[11px]' : 'text-[9px] md:text-[11px]'}`}>{s}</span>
          ))}
        </span>
      ) : <span className="text-stone-200">—</span>,
    });
  }

  return (
    <div className="overflow-x-auto">
      <div className="md:min-w-0 border-t border-l border-stone-200">
        {/* 日期行（表头） */}
        <div className={gridCols} style={gridStyle}>
          <div className={`bg-stone-50 flex items-center justify-center text-[10px] md:text-xs font-bold text-stone-400 tracking-widest border-b border-r border-stone-200 px-0.5 py-1.5`}>日期</div>
          {cols.map((c, i) => (
            <div key={i} className="flex flex-col items-center justify-center border-b border-r border-stone-200 px-0.5 py-1">
              <span className="text-[11px] md:text-base font-bold text-stone-800 tracking-widest">{c.label}</span>
              {c.sub && <span className="text-[8px] md:text-[11px] text-stone-400 font-mono">{c.sub}</span>}
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} className={gridCols} style={gridStyle}>
            <div className={`bg-stone-50 flex items-center justify-center text-[10px] md:text-xs font-bold text-stone-400 tracking-widest border-b border-r border-stone-200 px-0.5 py-1.5`}>{row.label}</div>
            {cols.map((c, i) => (
              <GridCell key={i}>{row.cells(c)}</GridCell>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Header: React.FC<{ chart: BaZiChart }> = ({ chart }) => {
  const isMale = chart.gender === '乾造 (男)';
  const solarDateStr = String(chart.solarDate || '');
  const isMatchingFailed = solarDateStr.includes('失败');
  return (
    <div className="px-4 py-3 md:px-6 md:py-4 bg-[#faf8f4] border-b border-stone-200">
      <div className="flex items-center justify-between text-[10px] md:text-sm leading-relaxed">
        <span className="flex items-baseline gap-1.5">
          <span className="text-stone-400 shrink-0">{isMale ? '乾造' : '坤造'}：</span>
          <span className="font-bold text-stone-800">{chart.name || '无标注'}</span>
        </span>
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-stone-400 shrink-0">气数：</span>
          <span className="truncate text-stone-500" title={chart.jieQi}>{chart.jieQi}</span>
        </span>
      </div>
      <div className="flex items-center justify-between mt-1 text-[10px] md:text-sm leading-relaxed">
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-stone-400 shrink-0">阴历：</span>
          <span className="font-bold text-stone-800 truncate" title={chart.lunarDate}>{chart.lunarDate}</span>
        </span>
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-stone-400 shrink-0">阳历：</span>
          <span className={`truncate ${isMatchingFailed ? 'text-rose-500 font-bold' : 'text-stone-600'}`} title={solarDateStr}>{solarDateStr}</span>
        </span>
      </div>
    </div>
  );
};

const BasicPanel: React.FC<{ chart: BaZiChart }> = ({ chart }) => {
  const cols: ColData[] = [
    { label: '年柱', data: chart.year, shenSha: shenShaNamesFor(chart.shenSha, 0) },
    { label: '月柱', data: chart.month, shenSha: shenShaNamesFor(chart.shenSha, 1) },
    { label: '日柱', data: chart.day, isDayMaster: true, shenSha: shenShaNamesFor(chart.shenSha, 2) },
    { label: '时柱', data: chart.hour, shenSha: shenShaNamesFor(chart.shenSha, 3) },
  ];
  return (
    <div className="p-3 md:p-6 bg-white">
      <PillarGrid cols={cols} showShenSha isMale={chart.gender === '乾造 (男)'} />
    </div>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <h3 className="text-xs md:text-sm font-bold text-stone-500 tracking-widest mb-2.5 flex items-center gap-2">
    <span className="w-1 h-3 bg-amber-700 rounded-full inline-block" />
    {children}
    {hint && <span className="text-[10px] text-stone-300 font-normal">{hint}</span>}
  </h3>
);

const ProPanel: React.FC<{ chart: BaZiChart }> = ({ chart }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const dm = chart.day.gan;
  const allLiuNian = chart.luckPillars.flatMap(lp => lp.liuNian);
  const currentLiuNian = allLiuNian.find(ln => ln.year === currentYear);
  const currentLuck = chart.luckPillars.find(lp => currentYear >= lp.startYear && currentYear <= lp.endYear);

  const [selectedLuckIdx, setSelectedLuckIdx] = useState<number | null>(() => {
    const i = chart.luckPillars.findIndex(lp => currentYear >= lp.startYear && currentYear <= lp.endYear);
    return i !== -1 ? i : (chart.luckPillars.length ? 0 : null);
  });
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear);

  const birthYear = chart.luckPillars[0]?.liuNian?.[0]?.year;
  const xuSui = birthYear && selectedYear != null ? selectedYear - birthYear + 1 : undefined;

  const selectedLiuNian = selectedYear != null ? allLiuNian.find(ln => ln.year === selectedYear) : undefined;
  const selectedLuck = selectedLuckIdx != null ? chart.luckPillars[selectedLuckIdx] : undefined;
  const effectiveLiuNian = selectedLiuNian || currentLiuNian;
  const effectiveLuck = selectedLuck || currentLuck;

  const cols: ColData[] = [
    { label: '流年', sub: effectiveLiuNian ? `${effectiveLiuNian.year}年` : `${currentYear}年`, data: effectiveLiuNian ? flowPillar(effectiveLiuNian.gan, effectiveLiuNian.zhi, dm) : null },
    { label: '大运', sub: effectiveLuck ? `${effectiveLuck.startAge}–${endAgeOf(effectiveLuck)}岁` : '', data: effectiveLuck ? flowPillar(effectiveLuck.gan, effectiveLuck.zhi, dm) : null },
    { label: '年柱', data: chart.year, shenSha: shenShaNamesFor(chart.shenSha, 0) },
    { label: '月柱', data: chart.month, shenSha: shenShaNamesFor(chart.shenSha, 1) },
    { label: '日柱', data: chart.day, isDayMaster: true, shenSha: shenShaNamesFor(chart.shenSha, 2) },
    { label: '时柱', data: chart.hour, shenSha: shenShaNamesFor(chart.shenSha, 3) },
  ];

  return (
    <div className="p-3 md:p-6 bg-white space-y-5">
      <section>
        <SectionTitle hint="（流年＝当年干支，大运＝当前所行大运）">六柱细盘</SectionTitle>
        <PillarGrid cols={cols} showShenSha pro isMale={chart.gender === '乾造 (男)'} />
      </section>

      <section>
        {chart.luckPillars.length > 0 ? (
          <div className="bg-[#fdfdfb] flex flex-col select-none border border-stone-200 rounded-lg overflow-hidden">
            {/* 大运总览：顺行/逆行 + 起运 + 交运 + 司令 */}
            <div className="px-3 md:px-4 py-2 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] md:text-sm leading-tight">
              <span className="flex items-center gap-1.5">
                <span className="text-stone-400">大运:</span>
                <span className="font-bold text-amber-800">{chart.yunDirection || '—'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-stone-400">起运:</span>
                <span className="font-bold text-stone-700">{chart.qiYunDesc || chart.qiYunText || '—'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-stone-400">交运:</span>
                <span className="font-bold text-stone-700">{chart.jiaoYunDesc ? `${chart.jiaoYunDesc}（${chart.qiYunDate || ''}）` : (chart.qiYunDate || '—')}</span>
              </span>
              {chart.siLingDesc && (
                <span className="flex items-center gap-1.5">
                  <span className="text-stone-400">司令:</span>
                  <span className="font-bold text-stone-700">{chart.siLingDesc}</span>
                </span>
              )}
            </div>

            {/* 运限推演 */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-stone-50/50 border-b border-stone-100">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs md:text-sm">
                <Calendar size={14} />
                <span>运限推演</span>
                {xuSui && (
                  <span className="text-[10px] md:text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                    虚岁 {xuSui} 岁
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedYear && (
                  <span className="text-[10px] md:text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                    {selectedYear}年
                  </span>
                )}
              </div>
            </div>

            {/* 交互条：压缩列宽，不横滑 */}
            <div className="flex w-full bg-white">
              {chart.luckPillars.map((lp, idx) => {
                const isPreLuck = lp.type === 'PRE_LUCK';
                const isCurrentDaYun = currentYear >= lp.startYear && currentYear <= lp.endYear;
                const isSelectedLuck = selectedLuckIdx === idx;

                return (
                  <div
                    key={idx}
                    data-current={isCurrentDaYun ? 'true' : 'false'}
                    onClick={() => setSelectedLuckIdx(idx)}
                    className={`
                      flex-1 min-w-0 flex flex-col border-r border-stone-100 transition-all duration-200 cursor-pointer
                      ${isSelectedLuck ? 'bg-amber-50/40' : (isCurrentDaYun ? 'bg-amber-50/10' : 'bg-white')}
                      hover:bg-stone-50/50 last:border-r-0
                    `}
                  >
                    <div className={`
                      py-1 text-center border-b flex flex-col justify-center transition-colors
                      ${isSelectedLuck ? 'bg-amber-100/30' : (isCurrentDaYun ? 'bg-amber-50/20' : 'bg-stone-50/20')}
                    `}>
                      <span className="text-[8px] md:text-xs text-stone-400 font-mono leading-none">{lp.startYear}</span>
                      <span className={`text-[11px] md:text-2xl font-bold leading-none my-0.5 ${isSelectedLuck || isCurrentDaYun ? 'text-amber-900' : 'text-stone-700'}`}>
                        {isPreLuck ? '小运' : `${lp.gan}${lp.zhi}`}
                      </span>
                      <span className="text-[8px] md:text-[10px] text-stone-400 leading-none">{lp.startAge}岁</span>
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
                            className={`
                              flex justify-center items-center py-[3px] md:py-2 text-[9px] md:text-lg transition-all duration-200 border-b border-stone-50/50
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
        ) : (
          <p className="text-xs text-stone-300">暂无大运数据</p>
        )}
      </section>
    </div>
  );
};

const BaZiChartDisplay: React.FC<BaZiChartDisplayProps> = React.memo(({ chart }) => {
  const [viewTab, setViewTab] = useState<'BASIC' | 'PRO'>('BASIC');
  const solarDateStr = String(chart.solarDate || '');
  const isMatchingFailed = solarDateStr.includes('失败');

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden mt-0 md:mt-1 animate-fade-in relative mx-auto max-w-full">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-900 via-amber-700 to-rose-900"></div>

      <Header chart={chart} />

      {/* 命盘切换 Tab */}
      <div className="flex bg-[#fdfdfb] border-b border-stone-200 select-none">
        <button
          onClick={() => setViewTab('BASIC')}
          className={`flex-1 py-2.5 text-sm font-bold tracking-widest transition-all relative ${viewTab === 'BASIC' ? 'text-[#2b2320]' : 'text-stone-400 hover:text-stone-600'}`}
        >
          基本排盘
          {viewTab === 'BASIC' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-amber-700 rounded-full" />}
        </button>
        <button
          onClick={() => setViewTab('PRO')}
          className={`flex-1 py-2.5 text-sm font-bold tracking-widest transition-all relative ${viewTab === 'PRO' ? 'text-[#2b2320]' : 'text-stone-400 hover:text-stone-600'}`}
        >
          专业细盘
          {viewTab === 'PRO' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-amber-700 rounded-full" />}
        </button>
      </div>

      {isMatchingFailed && (
        <div className="bg-rose-50 p-2 flex items-center gap-2 border-b border-rose-100">
          <AlertTriangle className="text-rose-600 shrink-0" size={16} />
          <p className="text-[10px] md:text-xs text-rose-800 font-bold">
            注意：输入组合在1900-2100年间无对应日期，以下排盘仅供参考。
          </p>
        </div>
      )}

      {viewTab === 'BASIC' ? <BasicPanel chart={chart} /> : <ProPanel chart={chart} />}
    </div>
  );
});

export default BaZiChartDisplay;
