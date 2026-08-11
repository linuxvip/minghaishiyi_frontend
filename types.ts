
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
  xingYun?: string; // 十二长生（星运，相对日主）
  ziZuo?: string;   // 自坐（该柱天干坐该柱地支之十二长生）
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
  ganShiShen?: string; // 大运天干十神
  zhiShiShen?: string; // 大运地支本气十神
  liuNian: LiuNian[];
}

export interface ElementCount {
  element: string; // 五行
  count: number;
}

export interface ShenShaItem {
  name: string; // 神煞名
  pos: string;  // 位置（年干/年支/月干/月支/日干/日支/时干/时支/日柱）
}

export interface DayMasterStrength {
  level: string;        // 身强 / 偏强 / 中和 / 偏弱 / 身弱
  description: string;  // 说明
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
  yunDirection?: string; // 大运顺行/逆行
  qiYunText?: string;    // 起运描述，如 "3岁4个月0天交运"
  qiYunDate?: string;    // 交运公历日期
  weekDay?: string;      // 星期
  zodiac?: string;       // 生肖（以立春为界）
  constellation?: string;// 星座
  name?: string;         // 命主姓名
  qiYunDesc?: string;    // 起运说明：出生后 X年X月X日X时起运
  jiaoYunDesc?: string;  // 交运说明：于X节后 X天X时X分交运，逢X尾数年换运
  siLingDesc?: string;   // 月令司令说明
  wuXing?: ElementCount[];       // 八字五行占比（天干+地支本气，共8字）
  dayMasterStrength?: DayMasterStrength; // 日主强弱参考
  shenSha?: ShenShaItem[];       // 神煞（每柱多行，含位置）
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
