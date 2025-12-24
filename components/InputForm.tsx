
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarType, Gender } from '../types';
import { MapPin, Search, ChevronRight, Clock, User, Calendar as CalendarIcon, AlertCircle, Lock } from 'lucide-react';
import { Solar, Lunar } from 'lunar-typescript';
import { CHINA_AREA_DATA } from '../utils/areaData';
import { convertToTrueSolarTime, getMonthStem, getHourStem } from '../utils/baziHelper';
import { ELEMENT_COLORS, STEM_ELEMENTS, BRANCH_ELEMENTS, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants';

interface InputFormProps {
  onCalculate: (data: any) => void;
}

const LocationPickerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (province: string, city: string, district: string, lng: number) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [activeTab, setActiveTab] = useState<'domestic' | 'overseas'>('domestic');
  const [pIdx, setPIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [dIdx, setDIdx] = useState(0);

  const provinces = CHINA_AREA_DATA;
  const cities = provinces[pIdx]?.c || [];
  const districts = cities[cIdx]?.c || [];

  if (!isOpen) return null;

  const handleConfirm = () => {
    const p = provinces[pIdx].n;
    const c = cities[cIdx]?.n || '';
    const d = districts[dIdx]?.n || '';
    const lng = districts[dIdx]?.l || cities[cIdx]?.l || provinces[pIdx].l || 120.0;
    onConfirm(p, c, d, lng);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#fdfcf8] w-full max-w-lg rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up border-t border-stone-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button onClick={onClose} className="text-stone-400 text-lg hover:text-stone-600 transition-colors">取消</button>
          <div className="flex bg-stone-100 p-1 rounded-full w-44">
             <button onClick={() => setActiveTab('domestic')} className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'domestic' ? 'bg-[#2b2320] text-white' : 'text-stone-400'}`}>国内</button>
             <button onClick={() => setActiveTab('overseas')} className={`flex-1 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'overseas' ? 'bg-[#2b2320] text-white' : 'text-stone-400'}`}>海外</button>
          </div>
          <div className="w-8"></div>
        </div>

        <div className="px-6 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input type="text" placeholder="搜索省份、城市" className="w-full bg-stone-100 border-none rounded-2xl py-3 pl-11 pr-4 focus:ring-1 focus:ring-stone-200 text-stone-700 placeholder:text-stone-300" />
          </div>
        </div>

        <div className="relative h-72 flex overflow-hidden border-t border-stone-100">
          <div className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 border-y border-stone-200/50 pointer-events-none z-10 bg-stone-500/5"></div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar py-32 snap-y snap-mandatory text-center">
             {provinces.map((p, i) => (
               <div key={p.n} onClick={() => {setPIdx(i); setCIdx(0); setDIdx(0);}} className={`h-12 flex items-center justify-center snap-center text-sm transition-all cursor-pointer ${pIdx === i ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-300'}`}>
                 {p.n}
               </div>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-32 snap-y snap-mandatory text-center">
             {cities.map((c, i) => (
               <div key={c.n} onClick={() => {setCIdx(i); setDIdx(0);}} className={`h-12 flex items-center justify-center snap-center text-sm transition-all cursor-pointer ${cIdx === i ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-300'}`}>
                 {c.n}
               </div>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-32 snap-y snap-mandatory text-center">
             {districts.map((d, i) => (
               <div key={d.n} onClick={() => setDIdx(i)} className={`h-12 flex items-center justify-center snap-center text-sm transition-all cursor-pointer ${dIdx === i ? 'text-[#2b2320] font-bold text-lg' : 'text-stone-300'}`}>
                 {d.n}
               </div>
             ))}
          </div>
        </div>

        <div className="p-6 bg-white border-t border-stone-100">
          <button onClick={handleConfirm} className="w-full py-4 bg-[#2b2320] text-white rounded-full text-lg font-bold shadow-lg active:scale-95 transition-all">确定选择</button>
        </div>
      </div>
    </div>
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

const InputForm: React.FC<InputFormProps> = ({ onCalculate }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [calendarType, setCalendarType] = useState<CalendarType>(CalendarType.SOLAR);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState('12:00');
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(true);
  const [longitude, setLongitude] = useState('116.42');
  const [locationName, setLocationName] = useState('北京市 东城区');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [directData, setDirectData] = useState({
    yearGan: '甲', yearZhi: '子',
    monthGan: '丙', monthZhi: '寅',
    dayGan: '甲', dayZhi: '子',
    hourGan: '甲', hourZhi: '子'
  });

  useEffect(() => {
    if (calendarType === CalendarType.DIRECT) {
      const newMonthStem = getMonthStem(directData.yearGan, directData.monthZhi);
      const newHourStem = getHourStem(directData.dayGan, directData.hourZhi);
      if (newMonthStem !== directData.monthGan || newHourStem !== directData.hourGan) {
        setDirectData(prev => ({ ...prev, monthGan: newMonthStem, hourGan: newHourStem }));
      }
    }
  }, [directData.yearGan, directData.monthZhi, directData.dayGan, directData.hourZhi, calendarType]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
  }, [currentTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calendarType !== CalendarType.DIRECT && (!dateStr || !timeStr)) {
        alert("请选择完整的出生日期和时间");
        return;
    }
    const [year, month, day] = dateStr ? String(dateStr).split('-').map(Number) : [0,0,0];
    const [hour, minute] = timeStr ? String(timeStr).split(':').map(Number) : [0,0];
    onCalculate({ year, month, day, hour, minute, gender, type: calendarType, useTrueSolarTime, longitude: parseFloat(longitude) || 120.0, directData });
  };

  const handleDirectChange = (key: string, val: string) => {
    setDirectData(prev => ({ ...prev, [key]: val }));
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
                    {t: CalendarType.DIRECT, l: '直接输入'}
                  ].map(item => (
                    <button key={item.t} type="button" onClick={() => setCalendarType(item.t)} className={`flex-1 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${calendarType === item.t ? 'bg-[#b39b7d] text-white shadow-md' : 'text-stone-400 hover:text-stone-500'}`}>
                      {item.l}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          {calendarType !== CalendarType.DIRECT ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">出生日期</span>
                <div className="flex items-center gap-1.5 bg-stone-100 p-2 rounded-xl border border-transparent focus-within:border-stone-200 overflow-hidden">
                    <CalendarIcon className="text-stone-300 shrink-0" size={16} />
                    <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="bg-transparent outline-none text-stone-700 font-bold text-xs md:text-sm flex-1 min-w-0" />
                    <div className="w-px h-3 bg-stone-200 shrink-0"></div>
                    <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} className="bg-transparent outline-none text-stone-700 font-bold text-xs md:text-sm w-[75px] md:w-[90px] shrink-0" />
                </div>
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
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                 <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">四柱录入 (自动锁定)</span>
                 <Lock size={10} className="text-stone-300" />
              </div>
              <div className="grid grid-cols-4 gap-1 bg-stone-200/30 p-2 rounded-2xl border border-stone-200/60 shadow-inner">
                {['year', 'month', 'day', 'hour'].map((p, idx) => (
                  <div key={p} className="flex flex-col gap-1">
                    <div className="text-[8px] text-stone-400 font-bold text-center uppercase tracking-tighter">
                      {['年', '月', '日', '时'][idx]}
                    </div>
                    {(p === 'month' || p === 'hour') ? (
                       <div className="bg-white/80 border border-stone-100 rounded-lg py-1.5 text-center font-serif font-bold text-stone-900 text-lg relative flex items-center justify-center">
                         {(directData as any)[`${p}Gan`]}
                         <div className="absolute top-0 right-0 p-0.5"><div className="w-1 h-1 bg-amber-400 rounded-full"></div></div>
                       </div>
                    ) : (
                       <select 
                         value={(directData as any)[`${p}Gan`]} 
                         onChange={(e) => handleDirectChange(`${p}Gan`, e.target.value)}
                         className="bg-white border border-stone-200 rounded-lg py-1.5 text-center font-serif font-bold text-stone-900 text-lg focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer appearance-none shadow-sm"
                       >
                         {HEAVENLY_STEMS.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    )}
                    <select 
                      value={(directData as any)[`${p}Zhi`]} 
                      onChange={(e) => handleDirectChange(`${p}Zhi`, e.target.value)}
                      className="bg-white border border-stone-200 rounded-lg py-1.5 text-center font-serif font-bold text-stone-900 text-lg focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer appearance-none shadow-sm"
                    >
                      {EARTHLY_BRANCHES.map(b => (p === 'month' && !['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'].includes(b)) ? null : <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSubmit}
          className="group relative w-full py-4 bg-[#2b2320] text-white rounded-xl text-lg font-bold tracking-[0.4em] shadow-lg overflow-hidden hover:shadow-xl active:scale-[0.99] transition-all mt-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span>开始排盘</span>
        </button>

        {/* 即时局预览 */}
        <div className="mt-6 pt-5 border-t border-stone-100">
           <div className="flex flex-row items-center justify-between w-full gap-2 md:gap-5 overflow-hidden whitespace-nowrap">
              <BaziClock time={currentTime} />
              <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="flex flex-row items-end justify-between w-full max-w-[240px] md:max-w-xs mb-2 px-1">
                    {currentInfo.pillars.map((p, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                         <span className="text-[8px] md:text-[9px] font-bold text-stone-300 leading-none">{p.label}</span>
                         <CharacterBlock char={p.gan} isStem={true} />
                         <CharacterBlock char={p.zhi} isStem={false} />
                      </div>
                    ))}
                  </div>
                  <div className="w-full text-center space-y-0.5 border-t border-stone-100/50 pt-1.5">
                     <p className="text-[8px] md:text-[10px] text-stone-500 font-bold truncate leading-none">
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

      <LocationPickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)}
        onConfirm={(p, c, d, lng) => {
          setLongitude(lng.toFixed(2));
          setLocationName(`${p} ${c}`);
        }}
      />
    </div>
  );
};

export default InputForm;
