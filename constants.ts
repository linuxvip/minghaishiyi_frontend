import { ElementColor, ElementType } from './types';

// Updated for Light Theme (Guofeng Style)
// Backgrounds are lighter (100/200), Texts are darker (800/900), Borders are subtle
export const ELEMENT_COLORS: Record<ElementType | string, ElementColor> = {
  '木': { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  '火': { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
  '土': { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
  '金': { bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400' },
  '水': { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' },
  'default': { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300' }
};

export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

export const BRANCH_ELEMENTS: Record<string, string> = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水'
};