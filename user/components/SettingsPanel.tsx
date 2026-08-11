import React from 'react';
import { Check } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import { Gender, CalendarType } from '../../types';
import { mergePreferences, TIMEZONE_OPTIONS } from '../preferences';

const Segmented: React.FC<{
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => (
  <div className="flex bg-stone-100 p-1 rounded-xl">
    {options.map((o) => (
      <button
        key={o.v}
        type="button"
        onClick={() => onChange(o.v)}
        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
          value === o.v ? 'bg-[#b39b7d] text-white shadow-md' : 'text-stone-400 hover:text-stone-500'
        }`}
      >
        {o.l}
      </button>
    ))}
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-[#b39b7d]' : 'bg-stone-300'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
);

const Row: React.FC<{ title: string; desc?: string; children: React.ReactNode }> = ({ title, desc, children }) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <div className="min-w-0">
      <span className="text-xs font-bold text-stone-700 block">{title}</span>
      {desc && <p className="text-[9px] text-stone-400 mt-0.5">{desc}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SettingsPanel: React.FC = () => {
  const { preferences, updatePreferences } = useUserAuth();
  const prefs = mergePreferences(preferences);

  const setPref = (patch: Partial<Record<string, unknown>>) => {
    updatePreferences({ ...mergePreferences(preferences), ...patch } as Record<string, unknown>);
  };

  return (
    <div className="bg-[#fdfcf8] rounded-[2rem] p-5 shadow-xl border border-stone-200/60">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-stone-600">常用排盘设置</h3>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
          <Check size={10} />
          自动同步
        </span>
      </div>
      <p className="text-[10px] text-stone-400 mb-2 leading-relaxed">
        修改后立即生效并同步到云端，排盘页将自动回填
      </p>

      <div className="divide-y divide-stone-100">
        <Row title="默认性别" desc="排盘页默认选中的性别">
          <Segmented
            value={prefs.gender ?? Gender.MALE}
            options={[
              { v: Gender.MALE, l: '乾造' },
              { v: Gender.FEMALE, l: '坤造' },
            ]}
            onChange={(v) => setPref({ gender: v })}
          />
        </Row>

        <Row title="默认排盘模式" desc="打开排盘页默认使用的输入方式">
          <Segmented
            value={prefs.calendarType ?? CalendarType.SOLAR}
            options={[
              { v: CalendarType.SOLAR, l: '公历' },
              { v: CalendarType.LUNAR, l: '农历' },
              { v: CalendarType.DIRECT, l: '四柱' },
            ]}
            onChange={(v) => setPref({ calendarType: v })}
          />
        </Row>

        <Row title="真太阳时校正" desc="按出生经度与日期修正真太阳时">
          <Toggle checked={prefs.useTrueSolarTime ?? true} onChange={(v) => setPref({ useTrueSolarTime: v })} />
        </Row>

        <Row title="晚子时换日" desc="23:00-24:00 日柱按次日计算">
          <Toggle checked={prefs.sect === 1} onChange={(v) => setPref({ sect: v ? 1 : 2 })} />
        </Row>

        <Row title="手动经度" desc="打开后填写东经，留空用所选地点经度">
          <Toggle checked={prefs.useManualLongitude ?? false} onChange={(v) => setPref({ useManualLongitude: v })} />
        </Row>

        {prefs.useManualLongitude && (
          <Row title="经度值" desc="东经为正，如 116.42">
            <input
              type="number"
              step="0.01"
              value={prefs.manualLongitude ?? ''}
              onChange={(e) => setPref({ manualLongitude: e.target.value })}
              placeholder="116.42"
              className="w-28 bg-stone-100 rounded-lg px-3 py-2 text-xs font-bold text-stone-700 outline-none focus:ring-1 focus:ring-[#b39b7d] placeholder:text-stone-300"
            />
          </Row>
        )}

        <Row title="出生时区" desc="当地钟表时间对应时区 (默认东八区)">
          <select
            value={prefs.timezoneOffset ?? '8'}
            onChange={(e) => setPref({ timezoneOffset: e.target.value })}
            className="bg-white rounded-lg text-xs font-bold text-stone-700 px-2 py-1.5 border border-stone-200 focus:outline-none focus:border-[#b39b7d]"
          >
            {TIMEZONE_OPTIONS.map((o) => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
        </Row>
      </div>
    </div>
  );
};

export default SettingsPanel;
