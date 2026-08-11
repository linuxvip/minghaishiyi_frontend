
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants';

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
