
import { Solar, Lunar } from 'lunar-typescript';
import { BaZiChart, Gender, PillarData, LuckPillar, CalendarType, LiuNian } from '../types';
import { STEM_ELEMENTS, BRANCH_ELEMENTS, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants';

export const calculateEoT = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const B = (360 * (dayOfYear - 81)) / 365;
  const B_rad = (B * Math.PI) / 180;
  return 9.87 * Math.sin(2 * B_rad) - 7.53 * Math.cos(B_rad) - 1.5 * Math.sin(B_rad);
};

export const convertToTrueSolarTime = (
  year: number, month: number, day: number, 
  hour: number, minute: number, longitude: number
): { date: Date; eot: number; longOffset: number } => {
  const standardDate = new Date(year, month - 1, day, hour, minute);
  const longOffset = (longitude - 120.0) * 4;
  const eot = calculateEoT(standardDate);
  const totalOffsetMinutes = longOffset + eot;
  const trueSolarDate = new Date(standardDate.getTime() + totalOffsetMinutes * 60 * 1000);
  return { date: trueSolarDate, eot, longOffset };
};

export const getMonthStem = (yearGan: string, monthZhi: string): string => {
  if (!yearGan || !monthZhi) return '';
  const monthBranches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  const yearGanIndex = HEAVENLY_STEMS.indexOf(String(yearGan));
  const monthZhiIndex = monthBranches.indexOf(String(monthZhi));
  
  if (yearGanIndex === -1 || monthZhiIndex === -1) return '';
  const startStemIndex = ((yearGanIndex % 5) * 2 + 2) % 10;
  const resultIndex = (startStemIndex + monthZhiIndex) % 10;
  return HEAVENLY_STEMS[resultIndex];
};

export const getHourStem = (dayGan: string, hourZhi: string): string => {
  if (!dayGan || !hourZhi) return '';
  const dayGanIndex = HEAVENLY_STEMS.indexOf(String(dayGan));
  const hourZhiIndex = EARTHLY_BRANCHES.indexOf(String(hourZhi));
  
  if (dayGanIndex === -1 || hourZhiIndex === -1) return '';
  const startStemIndex = ((dayGanIndex % 5) * 2) % 10;
  const resultIndex = (startStemIndex + hourZhiIndex) % 10;
  return HEAVENLY_STEMS[resultIndex];
};

const getElement = (char: string): string => {
  return STEM_ELEMENTS[String(char)] || BRANCH_ELEMENTS[String(char)] || '';
};

const getShiShenByName = (dayMaster: string, target: string): string => {
  if (!dayMaster || !target) return '';
  const dmElem = STEM_ELEMENTS[String(dayMaster)];
  const targetElem = STEM_ELEMENTS[String(target)];
  
  const dmIndex = HEAVENLY_STEMS.indexOf(String(dayMaster));
  const targetIndex = HEAVENLY_STEMS.indexOf(String(target));
  
  if (dmIndex === -1 || targetIndex === -1) return '';

  const dmPolarity = dmIndex % 2; 
  const targetPolarity = targetIndex % 2;
  const samePolarity = dmPolarity === targetPolarity;

  const elements = ['木', '火', '土', '金', '水'];
  const dmElemIdx = elements.indexOf(dmElem);
  const targetElemIdx = elements.indexOf(targetElem);

  let relation = (targetElemIdx - dmElemIdx + 5) % 5;

  switch (relation) {
    case 0: return samePolarity ? '比肩' : '劫财';
    case 1: return samePolarity ? '食神' : '伤官';
    case 2: return samePolarity ? '偏财' : '正财';
    case 3: return samePolarity ? '七杀' : '正官';
    case 4: return samePolarity ? '偏印' : '正印';
    default: return '';
  }
};

/**
 * 根据八字干支反查阳历日期
 * 范围: 1900-2100
 * 限制: 结果不得晚于当前时刻
 */
const findSolarDateFromBaZi = (
    yearGZ: string, monthGZ: string, dayGZ: string, hourGZ: string
): Solar | null => {
    const startYear = 1900;
    const now = new Date();
    const endYear = 2100;

    for (let y = startYear; y <= endYear; y++) {
        let currentSolar = Solar.fromYmd(y, 1, 1);
        const daysInYear = currentSolar.isLeapYear() ? 366 : 365;
        
        for (let d = 0; d < daysInYear; d++) {
            const lunar = currentSolar.getLunar();
            const eightChar = lunar.getEightChar();
            
            // EightChar 对象使用 getYear(), getMonth(), getDay() 获取干支字符串
            if (eightChar.getYear() === yearGZ && 
                eightChar.getMonth() === monthGZ && 
                eightChar.getDay() === dayGZ) {
                
                // 遍历时辰 (0, 2, 4...22)
                for (let h = 0; h < 24; h += 2) {
                    const hSolar = Solar.fromYmdHms(currentSolar.getYear(), currentSolar.getMonth(), currentSolar.getDay(), h, 0, 0);
                    const hEc = hSolar.getLunar().getEightChar();
                    
                    if (hEc.getTime() === hourGZ) {
                        // 校验：不能是未来时间
                        const resultTime = new Date(hSolar.getYear(), hSolar.getMonth()-1, hSolar.getDay(), hSolar.getHour()).getTime();
                        if (resultTime > now.getTime()) {
                            continue;
                        }
                        return hSolar;
                    }
                }
            }
            currentSolar = currentSolar.next(1);
            // 如果日期已经超过当前年份且超过当前日期，提前终止提升性能
            if (y === now.getFullYear() && currentSolar.getLunar().getSolar().toYmdHms() > Solar.fromDate(now).toYmdHms()) {
                break;
            }
        }
    }
    return null;
};

export const calculateBaZi = (
  year: number, month: number, day: number, hour: number, minute: number, gender: Gender,
  type: CalendarType, directData?: any, useTrueSolarTime?: boolean, longitude?: number
): BaZiChart => {
  let solar: Solar | null = null;
  let lunar: Lunar;
  let correctionInfo = '';

  if (type === CalendarType.DIRECT && directData) {
      const yearGZ = String(directData.yearGan) + String(directData.yearZhi);
      const monthGZ = String(directData.monthGan) + String(directData.monthZhi);
      const dayGZ = String(directData.dayGan) + String(directData.dayZhi);
      const hourGZ = String(directData.hourGan) + String(directData.hourZhi);
      
      const foundSolar = findSolarDateFromBaZi(yearGZ, monthGZ, dayGZ, hourGZ);
      if (foundSolar) {
          solar = foundSolar;
          lunar = solar.getLunar();
      } else {
          const createPillar = (gan: string, zhi: string, isDay: boolean): PillarData => ({
              gan, zhi, ganElement: getElement(gan), zhiElement: getElement(zhi),
              shiShen: isDay ? '日主' : getShiShenByName(directData.dayGan, gan),
              cangGan: [], cangGanShiShen: [], naYin: '', xunKong: ''
          });
          return {
              year: createPillar(directData.yearGan, directData.yearZhi, false),
              month: createPillar(directData.monthGan, directData.monthZhi, false),
              day: createPillar(directData.dayGan, directData.dayZhi, true),
              hour: createPillar(directData.hourGan, directData.hourZhi, false),
              gender, solarDate: '匹配失败 (1900-2100内无此日或在未来)', lunarDate: '无匹配日期',
              jieQi: '无信息', luckPillars: [], dayMasterElement: getElement(directData.dayGan), isDirectInput: true
          };
      }
  } else {
      let ty = year, tm = month, td = day, th = hour, tmin = minute;
      if (useTrueSolarTime && longitude !== undefined) {
          const trueSolar = convertToTrueSolarTime(year, month, day, hour, minute, longitude);
          const tDate = trueSolar.date;
          ty = tDate.getFullYear(); tm = tDate.getMonth() + 1; td = tDate.getDate();
          th = tDate.getHours(); tmin = tDate.getMinutes();
          correctionInfo = ` (修正: ${(trueSolar.eot + trueSolar.longOffset).toFixed(1)}分)`;
      }
      if (type === CalendarType.SOLAR) {
        solar = Solar.fromYmdHms(ty, tm, td, th, tmin, 0);
        lunar = solar.getLunar();
      } else {
        lunar = Lunar.fromYmdHms(ty, tm, td, th, tmin, 0);
        solar = lunar.getSolar();
      }
  }

  const eightChar = lunar.getEightChar();
  const formatPillar = (gan: string, zhi: string, idx: number): PillarData => {
     const dm = eightChar.getDayGan();
     let shiShen = idx === 2 ? '日主' : getShiShenByName(dm, gan);
     
     const branchesHideStems: Record<string, string[]> = {
         '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
         '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'],
         '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
         '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
     };

     return {
       gan, zhi, ganElement: getElement(gan), zhiElement: getElement(zhi), shiShen,
       cangGan: branchesHideStems[zhi] || [],
       cangGanShiShen: [], naYin: idx === 0 ? eightChar.getYearNaYin() : idx === 1 ? eightChar.getMonthNaYin() : idx === 2 ? eightChar.getDayNaYin() : eightChar.getTimeNaYin(),
       xunKong: idx === 0 ? eightChar.getYearXunKong() : idx === 1 ? eightChar.getMonthXunKong() : idx === 2 ? eightChar.getDayXunKong() : eightChar.getTimeXunKong()
     };
  };

  const yun = eightChar.getYun(gender === Gender.MALE ? 1 : 0);
  const luckPillars: LuckPillar[] = yun.getDaYun().slice(0, 9).map((dy: any, i: number) => ({
      type: i === 0 ? 'PRE_LUCK' : 'DA_YUN',
      startAge: dy.getStartAge(), startYear: dy.getStartYear(), endYear: dy.getEndYear(),
      gan: dy.getGanZhi().substring(0, 1), zhi: dy.getGanZhi().substring(1, 2),
      liuNian: dy.getLiuNian().map((ln: any) => ({
          year: ln.getYear(), gan: ln.getGanZhi().substring(0, 1), zhi: ln.getGanZhi().substring(1, 2), age: ln.getAge()
      }))
  }));

  return {
    year: formatPillar(eightChar.getYearGan(), eightChar.getYearZhi(), 0),
    month: formatPillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), 1),
    day: formatPillar(eightChar.getDayGan(), eightChar.getDayZhi(), 2),
    hour: formatPillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), 3),
    gender, solarDate: type === CalendarType.DIRECT ? `(推算) ${solar.toYmdHms()}` : `${solar.toYmdHms()}${correctionInfo}`,
    lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    jieQi: `上节: ${lunar.getPrevJieQi().getName()} | 下气: ${lunar.getNextJieQi().getName()}`,
    luckPillars, dayMasterElement: getElement(eightChar.getDayGan()), isDirectInput: false
  };
};
