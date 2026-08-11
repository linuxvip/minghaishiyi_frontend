import { Gender, CalendarType } from '../types';

export const TIMEZONE_OPTIONS: { v: string; l: string }[] = [
  { v: '-12', l: 'UTC-12' },
  { v: '-11', l: 'UTC-11' },
  { v: '-10', l: 'UTC-10' },
  { v: '-9', l: 'UTC-9' },
  { v: '-8', l: 'UTC-8 (美西)' },
  { v: '-7', l: 'UTC-7' },
  { v: '-6', l: 'UTC-6 (美中)' },
  { v: '-5', l: 'UTC-5 (美东)' },
  { v: '-4', l: 'UTC-4' },
  { v: '-3', l: 'UTC-3' },
  { v: '-1', l: 'UTC-1' },
  { v: '0', l: 'UTC+0 (伦敦)' },
  { v: '1', l: 'UTC+1' },
  { v: '2', l: 'UTC+2' },
  { v: '3', l: 'UTC+3' },
  { v: '4', l: 'UTC+4' },
  { v: '5', l: 'UTC+5' },
  { v: '6', l: 'UTC+6' },
  { v: '7', l: 'UTC+7' },
  { v: '8', l: 'UTC+8 (北京, 默认)' },
  { v: '9', l: 'UTC+9 (东京)' },
  { v: '10', l: 'UTC+10 (悉尼)' },
  { v: '11', l: 'UTC+11' },
  { v: '12', l: 'UTC+12' },
  { v: '13', l: 'UTC+13' },
  { v: '14', l: 'UTC+14' },
];

export interface PaiPanPreferences {
  gender?: string;
  calendarType?: string;
  timezoneOffset?: string;
  sect?: number;
  useTrueSolarTime?: boolean;
  useManualLongitude?: boolean;
  manualLongitude?: string;
  locationName?: string;
  longitude?: string;
  latitude?: string;
}

// 与 InputForm 初始值保持一致
export const DEFAULT_PREFERENCES: PaiPanPreferences = {
  gender: Gender.MALE,
  calendarType: CalendarType.SOLAR,
  timezoneOffset: '8',
  sect: 2,
  useTrueSolarTime: true,
  useManualLongitude: false,
  manualLongitude: '',
  locationName: '北京市 东城区',
  longitude: '116.42',
  latitude: '39.93',
};

export const mergePreferences = (p: Record<string, unknown>): PaiPanPreferences => ({
  ...DEFAULT_PREFERENCES,
  ...(p ?? {}),
});

export interface PreferenceSetters {
  setGender: (g: Gender) => void;
  setCalendarType: (t: CalendarType) => void;
  setTimezoneOffset: (v: string) => void;
  setSect: (v: 1 | 2) => void;
  setUseTrueSolarTime: (v: boolean) => void;
  setUseManualLongitude: (v: boolean) => void;
  setManualLongitude: (v: string) => void;
  setLocationName: (v: string) => void;
  setLongitude: (v: string) => void;
  setLatitude: (v: string) => void;
}

// 将云端偏好应用到表单状态（缺失字段跳过，避免覆盖用户当前输入）
export const applyPreferences = (p: Record<string, unknown>, s: PreferenceSetters): void => {
  if (typeof p.gender === 'string') {
    s.setGender(p.gender === Gender.MALE ? Gender.MALE : Gender.FEMALE);
  }
  if (typeof p.calendarType === 'string') {
    s.setCalendarType(p.calendarType as CalendarType);
  }
  if (typeof p.timezoneOffset === 'string') s.setTimezoneOffset(p.timezoneOffset);
  if (typeof p.sect === 'number') s.setSect(p.sect as 1 | 2);
  if (typeof p.useTrueSolarTime === 'boolean') s.setUseTrueSolarTime(p.useTrueSolarTime);
  if (typeof p.useManualLongitude === 'boolean') s.setUseManualLongitude(p.useManualLongitude);
  if (typeof p.manualLongitude === 'string') s.setManualLongitude(p.manualLongitude);
  if (typeof p.locationName === 'string') s.setLocationName(p.locationName);
  if (typeof p.longitude === 'string') s.setLongitude(p.longitude);
  if (typeof p.latitude === 'string') s.setLatitude(p.latitude);
};
