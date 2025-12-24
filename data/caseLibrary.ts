
import { CaseRecord, Gender } from '../types';

export const MOCK_CASES: CaseRecord[] = [
  {
    id: '1',
    source: '《三命通会》卷九',
    gender: Gender.MALE,
    yearGZ: '丁卯',
    monthGZ: '癸卯',
    dayGZ: '乙亥',
    hourGZ: '丙子',
    feedback: '此为岳飞命造。水木清华，印绶叠见。岁干透丁，月透癸，枭神夺食，亦主中途坎坷。',
    tags: ['名将', '枭夺食', '忠烈']
  },
  {
    id: '2',
    source: '实战案例集',
    gender: Gender.FEMALE,
    yearGZ: '庚申',
    monthGZ: '己丑',
    dayGZ: '庚辰',
    hourGZ: '庚辰',
    feedback: '此造土金两旺，金水虽不显，但辰中藏水。早年行木火运，事业平平；中年入西方金运，经营建材生意大发。',
    tags: ['从旺格', '建材商', '中晚年发财']
  },
  {
    id: '3',
    source: '《千里命稿》',
    gender: Gender.MALE,
    yearGZ: '辛亥',
    monthGZ: '庚寅',
    dayGZ: '丙子',
    hourGZ: '乙未',
    feedback: '日主丙火，生于初春。亥中壬水，子中癸水，财官并见。早年困顿，至中年南方火地，官至部督。',
    tags: ['身弱财官', '仕途']
  },
  {
    id: '4',
    source: '现代临床案例',
    gender: Gender.FEMALE,
    yearGZ: '戊午',
    monthGZ: '丁巳',
    dayGZ: '壬子',
    hourGZ: '庚戌',
    feedback: '壬水生于巳月，财星当令。子午冲，水火不容。此命主婚姻不顺，多次离异，但财运极好，为某金融公司高管。',
    tags: ['冲克', '金融高管', '婚不顺']
  }
];
