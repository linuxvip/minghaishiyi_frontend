
export enum Gender {
  MALE = '乾造 (男)',
  FEMALE = '坤造 (女)',
}

export enum CalendarType {
  SOLAR = 'SOLAR',
  LUNAR = 'LUNAR',
  DIRECT = 'DIRECT',
}

export interface PillarData {
  gan: string; // Heavenly Stem
  zhi: string; // Earthly Branch
  ganElement: string;
  zhiElement: string;
  shiShen: string; // Ten Gods (for Stem)
  cangGan: string[]; // Hidden Stems
  cangGanShiShen: string[]; // Ten Gods for Hidden Stems
  naYin: string; // Na Yin
  xunKong: string; // Void/Kong Wang
}

export interface LiuNian {
  year: number;
  gan: string;
  zhi: string;
  age: number;
}

export interface LuckPillar {
  type: 'PRE_LUCK' | 'DA_YUN';
  startAge: number;
  startYear: number;
  endYear: number;
  gan: string;
  zhi: string;
  liuNian: LiuNian[];
}

export interface BaZiChart {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData;
  gender: Gender;
  solarDate: string;
  lunarDate: string;
  jieQi: string; // Solar Terms information
  luckPillars: LuckPillar[];
  dayMasterElement: string;
  isDirectInput: boolean;
  caseFeedback?: string; // 存储来自命例库的反馈
  caseSource?: string;   // 存储命例来源
}

export interface ElementColor {
  bg: string;
  text: string;
  border: string;
}

export type ElementType = '木' | '火' | '土' | '金' | '水';

export interface CaseRecord {
  id: string;
  source: string;
  gender: Gender;
  yearGZ: string;
  monthGZ: string;
  dayGZ: string;
  hourGZ: string;
  feedback: string;
  tags: string[];
}
