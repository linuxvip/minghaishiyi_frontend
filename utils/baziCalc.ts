
import { Solar, Lunar } from 'lunar-typescript';
import { BaZiChart, Gender, PillarData, LuckPillar, CalendarType, ElementCount, ShenShaItem, DayMasterStrength } from '../types';
import { STEM_ELEMENTS, BRANCH_ELEMENTS, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../constants';
import { convertToTrueSolarTime } from './baziHelper';

export interface CalculateBaZiOptions {
  second?: number;
  /** 出生时区（东八区小时数），仅公历输入生效；用于将当地钟表时间换算为东八区时间排盘 */
  timezoneOffset?: number;
  /** 换日规则：1=晚子时算次日，2=子正换日（默认） */
  sect?: number;
}

export const getElement = (char: string): string => {
  return STEM_ELEMENTS[String(char)] || BRANCH_ELEMENTS[String(char)] || '';
};

export const getShiShenByName = (dayMaster: string, target: string): string => {
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

// 仅用于「直接输入」且无匹配日期时的兜底展示
export const HIDE_STEMS: Record<string, string[]> = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
  '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'],
  '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
  '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
};

// ========== 星运（十二长生，相对日主） ==========
const XING_YUN_STATES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const CHANG_SHENG_BRANCH: Record<string, string> = {
  甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申',
  乙: '午', 丁: '酉', 己: '酉', 辛: '子', 癸: '卯',
};
const BRANCH_CYCLE = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const getXingYun = (dayGan: string, zhi: string): string => {
  const sheng = CHANG_SHENG_BRANCH[dayGan];
  if (!sheng) return '';
  const ganIdx = HEAVENLY_STEMS.indexOf(dayGan);
  const start = BRANCH_CYCLE.indexOf(sheng);
  const idx = BRANCH_CYCLE.indexOf(zhi);
  if (ganIdx === -1 || start === -1 || idx === -1) return '';
  const offset = (idx - start + 12) % 12;
  // 阳干顺行，阴干逆行
  const stateIdx = ganIdx % 2 === 0 ? offset : (12 - offset) % 12;
  return XING_YUN_STATES[stateIdx];
};

// ========== 任意干支 → 纳音 / 空亡（流年、大运等动态柱展示用） ==========
const NA_YIN_60: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火', '戊辰': '大林木', '己巳': '大林木',
  '庚午': '路旁土', '辛未': '路旁土', '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土', '庚辰': '白蜡金', '辛巳': '白蜡金',
  '壬午': '杨柳木', '癸未': '杨柳木', '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木', '壬辰': '长流水', '癸巳': '长流水',
  '甲午': '沙中金', '乙未': '沙中金', '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金', '甲辰': '覆灯火', '乙巳': '覆灯火',
  '丙午': '天河水', '丁未': '天河水', '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水', '丙辰': '沙中土', '丁巳': '沙中土',
  '戊午': '天上火', '己未': '天上火', '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
};

export const getNaYinByGanZhi = (gan: string, zhi: string): string => NA_YIN_60[gan + zhi] || '';

export const getXunKongByGanZhi = (gan: string, zhi: string): string => {
  const g = HEAVENLY_STEMS.indexOf(gan);
  const z = EARTHLY_BRANCHES.indexOf(zhi);
  if (g === -1 || z === -1) return '';
  const diff = (z - g + 12) % 12;
  const map: Record<number, [number, number]> = {
    0: [10, 11], 2: [0, 1], 4: [2, 3], 6: [4, 5], 8: [6, 7], 10: [8, 9],
  };
  const [a, b] = map[diff] || [0, 1];
  return EARTHLY_BRANCHES[a] + EARTHLY_BRANCHES[b];
};

// ========== 五行占比（天干 + 地支本气，共 8 字） ==========
const WU_XING_ORDER = ['木', '火', '土', '金', '水'];

const getWuXingCounts = (pillars: PillarData[]): ElementCount[] => {
  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) {
    if (p.ganElement) counts[p.ganElement] = (counts[p.ganElement] || 0) + 1;
    if (p.zhiElement) counts[p.zhiElement] = (counts[p.zhiElement] || 0) + 1;
  }
  return WU_XING_ORDER.map(e => ({ element: e, count: counts[e] }));
};

// ========== 日主强弱参考（同类+生我 计数 + 月令加权） ==========
const getDayMasterStrength = (
  dayMaster: string, dayMasterElement: string, pillars: PillarData[]
): DayMasterStrength => {
  const elements = ['木', '火', '土', '金', '水'];
  const dmIdx = elements.indexOf(dayMasterElement);
  if (dmIdx === -1) return { level: '中和', description: '数据不足，暂不作强弱判断。' };
  // 同类 = 同五行（比劫），生我 = 印
  const helpElems = new Set([dayMasterElement, elements[(dmIdx + 4) % 5]]);
  const counts = getWuXingCounts(pillars);
  let help = 0;
  for (const c of counts) if (helpElems.has(c.element)) help += c.count;
  // 月令（月支本气）同我或生我 → 得令 +1
  const monthZhiElem = pillars[1]?.zhiElement;
  const deLing = monthZhiElem ? helpElems.has(monthZhiElem) : false;
  const score = help + (deLing ? 1 : 0);

  let level: string, desc: string;
  if (score >= 6) { level = '身强'; desc = '同党（比劫/印）力旺，日主得势。'; }
  else if (score === 5) { level = '偏强'; desc = '同党略占优势，日主偏旺。'; }
  else if (score === 4) { level = '中和'; desc = '同党与异类相当，日主中和。'; }
  else if (score === 3) { level = '偏弱'; desc = '异类偏多，日主略弱。'; }
  else { level = '身弱'; desc = '同党（比劫/印）乏力，日主偏弱。'; }

  const deLingText = deLing ? '，月令得生扶' : '，月令失生扶';
  return {
    level,
    description: `${desc} 同党${help}字${deLingText}，日主${dayMaster}属${dayMasterElement}。`,
  };
};

// ========== 神煞（20+ 种） ==========
const GUA_REN_ZHI: Record<string, string[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
  辛: ['寅', '午'],
};
const SAN_HE_PALACE: Record<string, { tao: string; yiMa: string; huaGai: string; jieSha: string }> = {
  申: { tao: '酉', yiMa: '寅', huaGai: '辰', jieSha: '巳' },
  子: { tao: '酉', yiMa: '寅', huaGai: '辰', jieSha: '巳' },
  辰: { tao: '酉', yiMa: '寅', huaGai: '辰', jieSha: '巳' },
  寅: { tao: '卯', yiMa: '申', huaGai: '戌', jieSha: '亥' },
  午: { tao: '卯', yiMa: '申', huaGai: '戌', jieSha: '亥' },
  戌: { tao: '卯', yiMa: '申', huaGai: '戌', jieSha: '亥' },
  巳: { tao: '午', yiMa: '亥', huaGai: '丑', jieSha: '寅' },
  酉: { tao: '午', yiMa: '亥', huaGai: '丑', jieSha: '寅' },
  丑: { tao: '午', yiMa: '亥', huaGai: '丑', jieSha: '寅' },
  亥: { tao: '子', yiMa: '巳', huaGai: '未', jieSha: '申' },
  卯: { tao: '子', yiMa: '巳', huaGai: '未', jieSha: '申' },
  未: { tao: '子', yiMa: '巳', huaGai: '未', jieSha: '申' },
};
const YANG_REN_ZHI: Record<string, string> = { 甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子' };
const LU_SHEN_ZHI: Record<string, string> = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
const WEN_CHANG_ZHI: Record<string, string> = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
const GUO_YIN_ZHI: Record<string, string> = { 甲: '戌', 乙: '亥', 丙: '丑', 丁: '寅', 戊: '丑', 己: '寅', 庚: '辰', 辛: '巳', 壬: '未', 癸: '申' };
const JIN_YU_ZHI: Record<string, string> = { 甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未', 己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅' };
const FU_XING_ZHI: Record<string, string[]> = {
  甲: ['寅', '子'], 丙: ['寅', '子'], 乙: ['卯', '丑'], 癸: ['卯', '丑'],
  戊: ['申'], 己: ['未'], 丁: ['亥'], 庚: ['午'], 辛: ['巳'], 壬: ['辰'],
};
const TIAN_CHU_ZHI: Record<string, string> = { 甲: '巳', 乙: '午', 丙: '子', 丁: '巳', 戊: '午', 己: '申', 庚: '寅', 辛: '午', 壬: '酉', 癸: '亥' };
const GU_CHEN_GUA_SU: Record<string, [string, string]> = {
  亥: ['寅', '戌'], 子: ['寅', '戌'], 丑: ['寅', '戌'],
  寅: ['巳', '丑'], 卯: ['巳', '丑'], 辰: ['巳', '丑'],
  巳: ['申', '辰'], 午: ['申', '辰'], 未: ['申', '辰'],
  申: ['亥', '未'], 酉: ['亥', '未'], 戌: ['亥', '未'],
};
// 天德贵人（以月支查，命带者四柱干支见该字）
const TIAN_DE: Record<string, string> = {
  寅: '丁', 卯: '申', 辰: '壬', 巳: '辛', 午: '亥', 未: '甲',
  申: '癸', 酉: '寅', 戌: '丙', 亥: '乙', 子: '巳', 丑: '庚',
};
// 月德贵人（以月支查四柱天干）
const YUE_DE: Record<string, string> = {
  寅: '丙', 午: '丙', 戌: '丙', 申: '壬', 子: '壬', 辰: '壬',
  亥: '甲', 卯: '甲', 未: '甲', 巳: '庚', 酉: '庚', 丑: '庚',
};
// 天医（月支退一位，查四支）
const TIAN_YI: Record<string, string> = {
  寅: '丑', 卯: '寅', 辰: '卯', 巳: '辰', 午: '巳', 未: '午',
  申: '未', 酉: '申', 戌: '酉', 亥: '戌', 子: '亥', 丑: '子',
};
// 德秀贵人（以月支查四柱天干）：德(印星)+秀(食伤)
const DE_XIU: Record<string, string[]> = {
  寅: ['丙', '丁', '戊', '癸'], 午: ['丙', '丁', '戊', '癸'], 戌: ['丙', '丁', '戊', '癸'],
  申: ['壬', '癸', '戊', '己', '丙', '辛', '甲', '己'], 子: ['壬', '癸', '戊', '己', '丙', '辛', '甲', '己'], 辰: ['壬', '癸', '戊', '己', '丙', '辛', '甲', '己'],
  巳: ['庚', '辛', '乙', '庚'], 酉: ['庚', '辛', '乙', '庚'], 丑: ['庚', '辛', '乙', '庚'],
  亥: ['甲', '乙', '丁', '壬'], 卯: ['甲', '乙', '丁', '壬'], 未: ['甲', '乙', '丁', '壬'],
};
const SHI_E_DA_BAI = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'];
const SHI_LING_RI = ['甲辰', '乙亥', '丙辰', '丁酉', '戊午', '庚戌', '庚寅', '辛亥', '壬寅', '癸未'];

const getSeason = (monthZhi: string): string => {
  if (['寅', '卯', '辰'].includes(monthZhi)) return 'spring';
  if (['巳', '午', '未'].includes(monthZhi)) return 'summer';
  if (['申', '酉', '戌'].includes(monthZhi)) return 'autumn';
  return 'winter';
};

// 人元司令分野（按节后日数划分三藏干司权）
const SI_LING: Record<string, { g1: string; d1: number; g2: string; d2: number; g3: string }> = {
  寅: { g1: '戊', d1: 7, g2: '丙', d2: 7, g3: '甲' },
  卯: { g1: '甲', d1: 10, g2: '乙', d2: 20, g3: '乙' },
  辰: { g1: '乙', d1: 9, g2: '癸', d2: 3, g3: '戊' },
  巳: { g1: '戊', d1: 7, g2: '庚', d2: 7, g3: '丙' },
  午: { g1: '丙', d1: 10, g2: '己', d2: 9, g3: '丁' },
  未: { g1: '丁', d1: 9, g2: '乙', d2: 3, g3: '己' },
  申: { g1: '戊', d1: 7, g2: '壬', d2: 7, g3: '庚' },
  酉: { g1: '庚', d1: 10, g2: '辛', d2: 20, g3: '辛' },
  戌: { g1: '辛', d1: 9, g2: '丁', d2: 3, g3: '戊' },
  亥: { g1: '戊', d1: 7, g2: '甲', d2: 7, g3: '壬' },
  子: { g1: '壬', d1: 10, g2: '癸', d2: 20, g3: '癸' },
  丑: { g1: '癸', d1: 9, g2: '辛', d2: 3, g3: '己' },
};

const getSiLing = (monthZhi: string, daysIntoJie: number): string => {
  const sp = SI_LING[monthZhi];
  if (!sp) return '';
  const gan = daysIntoJie < sp.d1 ? sp.g1 : daysIntoJie < sp.d1 + sp.d2 ? sp.g2 : sp.g3;
  return `${monthZhi}月·${gan}${getElement(gan)}司令（节后第${Math.max(1, daysIntoJie + 1)}日）`;
};

const getShenSha = (pillars: PillarData[], dayGan: string, gender: Gender): ShenShaItem[] => {
  const out: ShenShaItem[] = [];
  const seen = new Set<string>();
  const add = (name: string, pos: string) => {
    const key = name + '@' + pos;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name, pos });
  };

  const gans = pillars.map(p => p.gan);
  const zhis = pillars.map(p => p.zhi);
  const [yGan, mGan] = gans;
  const [yZhi, mZhi, dZhi, tZhi] = zhis;
  const ganPos = ['年干', '月干', '日干', '时干'];
  const zhiPos = ['年支', '月支', '日支', '时支'];
  const yNayinElem = pillars[0]?.naYin?.slice(-1) || '';
  const isMale = gender === Gender.MALE;

  const checkGans = (name: string, targets: Set<string> | string[]) => {
    const s = new Set(targets);
    gans.forEach((g, i) => { if (s.has(g)) add(name, ganPos[i]); });
  };
  const checkZhis = (name: string, targets: Set<string> | string[]) => {
    const s = new Set(targets);
    zhis.forEach((z, i) => { if (s.has(z)) add(name, zhiPos[i]); });
  };

  // 天乙贵人（年干+日干，查四支）
  checkZhis('天乙贵人', [...(GUA_REN_ZHI[yGan] || []), ...(GUA_REN_ZHI[dayGan] || [])]);

  // 三合局组（年支+日支基准）：桃花/驿马/华盖/劫煞
  const groupTargets: Record<string, Set<string>> = { 桃花: new Set(), 驿马: new Set(), 华盖: new Set(), 劫煞: new Set() };
  for (const a of new Set([yZhi, dZhi])) {
    const palace = SAN_HE_PALACE[a];
    if (!palace) continue;
    groupTargets.桃花.add(palace.tao);
    groupTargets.驿马.add(palace.yiMa);
    groupTargets.华盖.add(palace.huaGai);
    groupTargets.劫煞.add(palace.jieSha);
  }
  for (const [name, set] of Object.entries(groupTargets)) checkZhis(name, set);

  // 日干类
  if (YANG_REN_ZHI[dayGan]) checkZhis('羊刃', [YANG_REN_ZHI[dayGan]]);
  if (LU_SHEN_ZHI[dayGan]) checkZhis('禄神', [LU_SHEN_ZHI[dayGan]]);
  if (GUO_YIN_ZHI[dayGan]) checkZhis('国印贵人', [GUO_YIN_ZHI[dayGan]]);
  if (JIN_YU_ZHI[dayGan]) checkZhis('金舆', [JIN_YU_ZHI[dayGan]]);
  // 年干+日干辅查：文昌/福星/天厨
  for (const g of [yGan, dayGan]) {
    if (WEN_CHANG_ZHI[g]) checkZhis('文昌贵人', [WEN_CHANG_ZHI[g]]);
    if (FU_XING_ZHI[g]) checkZhis('福星贵人', FU_XING_ZHI[g]);
    if (TIAN_CHU_ZHI[g]) checkZhis('天厨贵人', [TIAN_CHU_ZHI[g]]);
  }

  // 孤辰/寡宿（年支）
  const gcs = GU_CHEN_GUA_SU[yZhi];
  if (gcs) {
    checkZhis('孤辰', [gcs[0]]);
    checkZhis('寡宿', [gcs[1]]);
  }

  // 天德（月支 → 四柱干支）、月德（月支 → 四干）、天医（月支退一位 → 四支）、德秀（月支 → 四干）
  const tianDe = TIAN_DE[mZhi];
  if (tianDe) {
    const s = new Set([tianDe]);
    gans.forEach((g, i) => { if (s.has(g)) add('天德贵人', ganPos[i]); });
    zhis.forEach((z, i) => { if (s.has(z)) add('天德贵人', zhiPos[i]); });
  }
  const yueDe = YUE_DE[mZhi];
  if (yueDe) checkGans('月德贵人', [yueDe]);
  if (TIAN_YI[mZhi]) checkZhis('天医', [TIAN_YI[mZhi]]);
  if (DE_XIU[mZhi]) checkGans('德秀贵人', DE_XIU[mZhi]);

  // 日柱日
  const dGZ = gans[2] + zhis[2];
  if (SHI_E_DA_BAI.includes(dGZ)) add('十恶大败', '日柱');
  if (SHI_LING_RI.includes(dGZ)) add('十灵日', '日柱');

  // 童子煞（季节 + 年纳音，查日支/时支）
  const tongZi: Set<string> = new Set();
  const season = getSeason(mZhi);
  if (season === 'spring' || season === 'autumn') { tongZi.add('寅'); tongZi.add('子'); }
  else { tongZi.add('卯'); tongZi.add('未'); tongZi.add('辰'); }
  if (yNayinElem === '金' || yNayinElem === '木') { tongZi.add('午'); tongZi.add('卯'); }
  else if (yNayinElem === '水' || yNayinElem === '火') { tongZi.add('酉'); tongZi.add('戌'); }
  else if (yNayinElem === '土') { tongZi.add('辰'); tongZi.add('巳'); }
  if (tongZi.has(dZhi)) add('童子煞', '日支');
  if (tongZi.has(tZhi)) add('童子煞', '时支');

  // 披麻（年支退三位）/吊客（年支退两位）/丧门（年支进两位），以年支查四支
  const idxOf = (c: string) => EARTHLY_BRANCHES.indexOf(c);
  const zOf = (i: number) => EARTHLY_BRANCHES[((i % 12) + 12) % 12];
  checkZhis('披麻', [zOf(idxOf(yZhi) - 3)]);
  checkZhis('吊客', [zOf(idxOf(yZhi) - 2)]);
  checkZhis('丧门', [zOf(idxOf(yZhi) + 2)]);

  // 天罗地网：男忌天罗（戌亥并见），女忌地网（辰巳并见）；另法：纳音火见戌亥日支为天罗、水土见辰巳日支为地网
  const hasXu = zhis.includes('戌'), hasHai = zhis.includes('亥'), hasChen = zhis.includes('辰'), hasSi = zhis.includes('巳');
  if (isMale && hasXu && hasHai) checkZhis('天罗', ['戌', '亥']);
  if (!isMale && hasChen && hasSi) checkZhis('地网', ['辰', '巳']);
  if (isMale && yNayinElem === '火' && (dZhi === '戌' || dZhi === '亥')) add('天罗', '日支');
  if (!isMale && (yNayinElem === '水' || yNayinElem === '土') && (dZhi === '辰' || dZhi === '巳')) add('地网', '日支');

  return out;
};

/**
 * 根据八字干支反查阳历日期。
 * 过去部分（1900→今天）直接复用 lunar-typescript 内置的 Solar.fromBaZi，
 * 它基于六十甲子周期 + 节气表定位，与 EightChar（sect=2，晚子时算次日）语义完全一致，
 * 比逐日扫描快几个数量级。
 * 过去无匹配时，前向扫描今天→2100（仅检查年柱匹配的年份，60 年一循环），
 * 保持"匹配失败"提示文案（1900-2100）与实际检索范围一致。
 */
const findSolarDateFromBaZi = (
    yearGZ: string, monthGZ: string, dayGZ: string, hourGZ: string, sect = 2
): Solar | null => {
    const now = new Date();

    // 过去部分：内置优化算法（1899→今天），结果按时间升序，取最近一次
    const past = Solar.fromBaZi(yearGZ, monthGZ, dayGZ, hourGZ, sect, 1900);
    if (past.length) return past[past.length - 1];

    // 前向部分：今天 → 2100
    const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    for (let Y = now.getFullYear(); Y <= 2100; Y++) {
        // 年柱预筛：年中日期必在立春之后，可代表该年的干支年柱
        const yearGanZhi = Solar.fromYmdHms(Y, 6, 1, 12, 0, 0).getLunar().getEightChar().getYear();
        if (yearGanZhi !== yearGZ) continue;

        let d = Solar.fromYmdHms(Y, 1, 1, 0, 0, 0);
        const endYmd = `${Y}-12-31`;
        while (d.toYmd() <= endYmd) {
            if (d.toYmd() >= todayYmd) {
                const ec = d.getLunar().getEightChar();
                if (ec.getYear() === yearGZ &&
                    ec.getMonth() === monthGZ &&
                    ec.getDay() === dayGZ) {
                    for (let h = 22; h >= 0; h -= 2) {
                        const hSolar = Solar.fromYmdHms(d.getYear(), d.getMonth(), d.getDay(), h, 0, 0);
                        if (hSolar.getLunar().getEightChar().getTime() === hourGZ) {
                            return hSolar;
                        }
                    }
                }
            }
            d = d.next(1);
        }
    }

    return null;
};

export const calculateBaZi = (
  year: number, month: number, day: number, hour: number, minute: number, gender: Gender,
  type: CalendarType, directData?: any, useTrueSolarTime?: boolean, longitude?: number,
  options?: CalculateBaZiOptions
): BaZiChart => {
  const sect = options?.sect ?? 2;
  const timezoneOffset = options?.timezoneOffset ?? 8;
  let solar: Solar | null = null;
  let lunar: Lunar;
  let correctionInfo = '';

  if (type === CalendarType.DIRECT && directData) {
      const yearGZ = String(directData.yearGan) + String(directData.yearZhi);
      const monthGZ = String(directData.monthGan) + String(directData.monthZhi);
      const dayGZ = String(directData.dayGan) + String(directData.dayZhi);
      const hourGZ = String(directData.hourGan) + String(directData.hourZhi);

      const foundSolar = findSolarDateFromBaZi(yearGZ, monthGZ, dayGZ, hourGZ, sect);
      if (foundSolar) {
          solar = foundSolar;
          lunar = solar.getLunar();
      } else {
          const createPillar = (gan: string, zhi: string, isDay: boolean): PillarData => ({
              gan, zhi, ganElement: getElement(gan), zhiElement: getElement(zhi),
              shiShen: isDay ? '日主' : getShiShenByName(directData.dayGan, gan),
              cangGan: HIDE_STEMS[zhi] || [],
              cangGanShiShen: (HIDE_STEMS[zhi] || []).map(h => isDay ? '—' : getShiShenByName(directData.dayGan, h)),
              naYin: '', xunKong: ''
          });
          return {
              year: createPillar(directData.yearGan, directData.yearZhi, false),
              month: createPillar(directData.monthGan, directData.monthZhi, false),
              day: createPillar(directData.dayGan, directData.dayZhi, true),
              hour: createPillar(directData.hourGan, directData.hourZhi, false),
              gender, solarDate: '匹配失败 (1900-至今无此八字组合)', lunarDate: '无匹配日期',
              jieQi: '无信息', luckPillars: [], dayMasterElement: getElement(directData.dayGan), isDirectInput: true
          };
      }
  } else if (type === CalendarType.LUNAR) {
      // 农历输入：直接按东八区农历日期排盘（农历历法本身以东八区为基准），
      // 闰月用负数月份表示；再转为公历做真太阳时修正。
      const baseLunar = Lunar.fromYmdHms(year, month, day, hour, minute, options?.second ?? 0);
      let solarForCorrection = baseLunar.getSolar();
      if (useTrueSolarTime && longitude !== undefined) {
          const trueSolar = convertToTrueSolarTime(
              solarForCorrection.getYear(), solarForCorrection.getMonth(),
              solarForCorrection.getDay(), solarForCorrection.getHour(),
              solarForCorrection.getMinute(), longitude
          );
          const tDate = trueSolar.date;
          solarForCorrection = Solar.fromYmdHms(
              tDate.getFullYear(), tDate.getMonth() + 1, tDate.getDate(),
              tDate.getHours(), tDate.getMinutes(), 0
          );
          correctionInfo = ` (修正: ${(trueSolar.eot + trueSolar.longOffset).toFixed(1)}分)`;
      }
      solar = solarForCorrection;
      lunar = solar.getLunar();
  } else {
      let ty = year, tm = month, td = day, th = hour, tmin = minute, ts = options?.second ?? 0;
      // 时区换算：当地钟表时间 → 东八区标准时间（四柱以北京时间为准）
      if (timezoneOffset !== 8) {
          const utcMs = Date.UTC(ty, tm - 1, td, th, tmin, ts) - timezoneOffset * 3600000;
          const bj = new Date(utcMs + 8 * 3600000);
          ty = bj.getUTCFullYear(); tm = bj.getUTCMonth() + 1; td = bj.getUTCDate();
          th = bj.getUTCHours(); tmin = bj.getUTCMinutes(); ts = bj.getUTCSeconds();
      }
      if (useTrueSolarTime && longitude !== undefined) {
          const trueSolar = convertToTrueSolarTime(ty, tm, td, th, tmin, longitude);
          const tDate = trueSolar.date;
          ty = tDate.getFullYear(); tm = tDate.getMonth() + 1; td = tDate.getDate();
          th = tDate.getHours(); tmin = tDate.getMinutes();
          correctionInfo = ` (修正: ${(trueSolar.eot + trueSolar.longOffset).toFixed(1)}分)`;
      }
      solar = Solar.fromYmdHms(ty, tm, td, th, tmin, ts);
      lunar = solar.getLunar();
  }

  const eightChar = lunar.getEightChar();
  eightChar.setSect(sect);
  const formatPillar = (gan: string, zhi: string, idx: number): PillarData => {
     const dm = eightChar.getDayGan();
     const hideGanArr = [eightChar.getYearHideGan(), eightChar.getMonthHideGan(), eightChar.getDayHideGan(), eightChar.getTimeHideGan()];
     const hideShiShenArr = [eightChar.getYearShiShenZhi(), eightChar.getMonthShiShenZhi(), eightChar.getDayShiShenZhi(), eightChar.getTimeShiShenZhi()];

     return {
       gan, zhi, ganElement: getElement(gan), zhiElement: getElement(zhi),
       shiShen: idx === 2 ? '日主' : getShiShenByName(dm, gan),
       cangGan: hideGanArr[idx] || [],
       cangGanShiShen: hideShiShenArr[idx] || [],
       naYin: idx === 0 ? eightChar.getYearNaYin() : idx === 1 ? eightChar.getMonthNaYin() : idx === 2 ? eightChar.getDayNaYin() : eightChar.getTimeNaYin(),
       xunKong: idx === 0 ? eightChar.getYearXunKong() : idx === 1 ? eightChar.getMonthXunKong() : idx === 2 ? eightChar.getDayXunKong() : eightChar.getTimeXunKong(),
       xingYun: getXingYun(dm, zhi),
       ziZuo: getXingYun(gan, zhi)
     };
  };

  const dmGan = eightChar.getDayGan();
  const yun = eightChar.getYun(gender === Gender.MALE ? 1 : 0, sect);
  // 小运：以时柱干支顺行（阳男阴女）/逆行（阴男阳女）一位
  const xiaoYunStep = yun.isForward() ? 1 : -1;
  const shiGIdx = HEAVENLY_STEMS.indexOf(eightChar.getTimeGan());
  const shiZIdx = EARTHLY_BRANCHES.indexOf(eightChar.getTimeZhi());
  const luckPillars: LuckPillar[] = yun.getDaYun().slice(0, 9).map((dy: any, i: number) => {
    const isPre = i === 0;
    let gan = dy.getGanZhi().substring(0, 1);
    let zhi = dy.getGanZhi().substring(1, 2);
    if (isPre && (!gan || !zhi) && shiGIdx !== -1 && shiZIdx !== -1) {
      gan = HEAVENLY_STEMS[(shiGIdx + xiaoYunStep + 10) % 10];
      zhi = EARTHLY_BRANCHES[(shiZIdx + xiaoYunStep + 12) % 12];
    }
    return {
      type: isPre ? 'PRE_LUCK' : 'DA_YUN',
      startAge: dy.getStartAge(), startYear: dy.getStartYear(), endYear: dy.getEndYear(),
      gan, zhi,
      ganShiShen: getShiShenByName(dmGan, gan),
      zhiShiShen: getShiShenByName(dmGan, (HIDE_STEMS[zhi] || [])[0]),
      liuNian: dy.getLiuNian().map((ln: any) => ({
          year: ln.getYear(), gan: ln.getGanZhi().substring(0, 1), zhi: ln.getGanZhi().substring(1, 2), age: ln.getAge()
      }))
    };
  });

  const pillars: PillarData[] = [
    formatPillar(eightChar.getYearGan(), eightChar.getYearZhi(), 0),
    formatPillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), 1),
    formatPillar(eightChar.getDayGan(), eightChar.getDayZhi(), 2),
    formatPillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), 3),
  ];

  const wuXing = getWuXingCounts(pillars);
  const dayMasterStrength = getDayMasterStrength(dmGan, getElement(dmGan), pillars);
  const shenSha = getShenSha(pillars, dmGan, gender);

  // 交运：起运时刻到「上一节（节气）」的精确间隔
  let qiYunDesc = '';
  let jiaoYunDesc = '';
  try {
    const startSolar = yun.getStartSolar();
    const prevJie = startSolar.getLunar().getPrevJie();
    const diffDays = startSolar.getJulianDay() - prevJie.getSolar().getJulianDay();
    const days = Math.max(0, Math.floor(diffDays));
    const hoursFloat = (diffDays - days) * 24;
    const hours = Math.floor(hoursFloat);
    const minutes = Math.max(0, Math.round((hoursFloat - hours) * 60));
    qiYunDesc = `出生后 ${yun.getStartYear()}年${yun.getStartMonth()}月${yun.getStartDay()}日${yun.getStartHour()}时起运`;
    jiaoYunDesc = `${prevJie.getName()}后 ${days}天${hours}时${minutes}分交运`;
  } catch {
    // 数据不足时保持空
  }

  // 月令司令（出生日距当节日数）
  let siLingDesc = '';
  try {
    const birthPrevJie = lunar.getPrevJie();
    const daysIntoJie = Math.floor(lunar.getSolar().getJulianDay() - birthPrevJie.getSolar().getJulianDay());
    siLingDesc = getSiLing(lunar.getMonthZhi(), daysIntoJie);
  } catch {
    // 保持空
  }

  return {
    year: pillars[0],
    month: pillars[1],
    day: pillars[2],
    hour: pillars[3],
    gender, solarDate: type === CalendarType.DIRECT ? `(推算) ${solar.toYmdHms()}` : `${solar.toYmdHms()}${correctionInfo}`,
    lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    jieQi: `上节: ${lunar.getPrevJieQi().getName()} | 下气: ${lunar.getNextJieQi().getName()}`,
    luckPillars, dayMasterElement: getElement(dmGan), isDirectInput: type === CalendarType.DIRECT,
    yunDirection: yun.isForward() ? '顺行' : '逆行',
    qiYunText: `起运 ${yun.getStartYear()}岁${yun.getStartMonth()}个月${yun.getStartDay()}天`,
    qiYunDate: `交运 ${yun.getStartSolar().toYmd()}`,
    qiYunDesc, jiaoYunDesc, siLingDesc,    weekDay: lunar.getWeekInChinese(),
    zodiac: lunar.getYearShengXiaoByLiChun(),
    constellation: solar.getXingZuo(),
    wuXing, dayMasterStrength, shenSha
  };
};
