import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { getDestinyCaseApi, createDestinyCaseApi, updateDestinyCaseApi } from '../../api/destiny-cases';
import { getFormErrorMessage } from '../../utils/errors';
import { useToast } from '../../../components/Toast';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../../../constants';

const PILLAR_KEYS = ['year_ganzhi', 'month_ganzhi', 'day_ganzhi', 'hour_ganzhi'] as const;

const validatePillar = (value: string): string | null => {
  if (!value.trim()) return '不能为空';
  if (value.length !== 2) return '格式应为"甲子"（2个汉字）';
  const [gan, zhi] = value;
  if (!HEAVENLY_STEMS.includes(gan)) return `"${gan}"不是有效天干`;
  if (!EARTHLY_BRANCHES.includes(zhi)) return `"${zhi}"不是有效地支`;
  return null;
};

const LABEL_KEYS = ['出身', '学历', '职业类别', '职业细分', '婚姻状态', '财富层次'];

interface LabelPair {
  key: string;
  value: string;
}

const parseLabelToPairs = (label: string | null): LabelPair[] => {
  if (!label) return [];
  try {
    const obj = JSON.parse(label);
    return Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => ({ key: k, value: String(v) }));
  } catch {
    return [];
  }
};

const pairsToLabel = (pairs: LabelPair[]): string => {
  const valid = pairs.filter((p) => p.key.trim() && p.value.trim());
  if (valid.length === 0) return '';
  const obj: Record<string, string> = {};
  valid.forEach((p) => { obj[p.key.trim()] = p.value.trim(); });
  return JSON.stringify(obj);
};

const DestinyCaseFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pillarErrors, setPillarErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    source: '',
    gender: 1,
    year_ganzhi: '',
    month_ganzhi: '',
    day_ganzhi: '',
    hour_ganzhi: '',
    feedback: '',
    original_url: '',
  });

  const [labelPairs, setLabelPairs] = useState<LabelPair[]>([]);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getDestinyCaseApi(Number(id))
        .then(({ data }) => {
          setForm({
            source: data.source || '',
            gender: data.gender,
            year_ganzhi: data.year_ganzhi || '',
            month_ganzhi: data.month_ganzhi || '',
            day_ganzhi: data.day_ganzhi || '',
            hour_ganzhi: data.hour_ganzhi || '',
            feedback: data.feedback || '',
            original_url: data.original_url || '',
          });
          setLabelPairs(parseLabelToPairs(data.label));
        })
        .catch(() => showToast('加载命例信息失败'))
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source.trim() || !form.year_ganzhi.trim() || !form.month_ganzhi.trim() || !form.day_ganzhi.trim() || !form.hour_ganzhi.trim()) {
      showToast('请填写必填字段：来源和四柱');
      return;
    }
    const errors: Record<string, string> = {};
    for (const key of PILLAR_KEYS) {
      const err = validatePillar((form as Record<string, string>)[key]);
      if (err) errors[key] = err;
    }
    if (Object.keys(errors).length > 0) {
      setPillarErrors(errors);
      showToast('请修正四柱格式错误');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const labelStr = pairsToLabel(labelPairs) || undefined;
      const payload = {
        source: form.source.trim(),
        gender: form.gender,
        year_ganzhi: form.year_ganzhi.trim(),
        month_ganzhi: form.month_ganzhi.trim(),
        day_ganzhi: form.day_ganzhi.trim(),
        hour_ganzhi: form.hour_ganzhi.trim(),
        feedback: form.feedback.trim() || undefined,
        original_url: form.original_url.trim() || undefined,
        label: labelStr,
      };
      if (isEdit) {
        await updateDestinyCaseApi(Number(id), payload);
        showToast('命例已更新');
      } else {
        await createDestinyCaseApi(payload);
        showToast('命例已创建');
      }
      navigate('/admin/destiny-cases');
    } catch (err) {
      setFormError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addLabelPair = () => {
    setLabelPairs([...labelPairs, { key: '', value: '' }]);
  };

  const updateLabelPair = (index: number, field: 'key' | 'value', val: string) => {
    setLabelPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  };

  const removeLabelPair = (index: number) => {
    setLabelPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const onKeySelect = (index: number, v: string) => {
    setLabelPairs((prev) => prev.map((p, i) => (i === index ? { ...p, key: v } : p)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-stone-300" size={28} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <button
        onClick={() => navigate('/admin/destiny-cases')}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="text-xs font-bold">返回命例列表</span>
      </button>

      <h1 className="text-xl font-bold text-stone-800 mb-6">{isEdit ? '编辑命例' : '新建命例'}</h1>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 md:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                来源 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="命例来源"
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                性别 <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: Number(e.target.value) })}
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value={1}>男</option>
                <option value={0}>女</option>
              </select>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
              四柱 <span className="text-rose-500">*</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
              {[
                { key: 'year_ganzhi', label: '年柱' },
                { key: 'month_ganzhi', label: '月柱' },
                { key: 'day_ganzhi', label: '日柱' },
                { key: 'hour_ganzhi', label: '时柱' },
              ].map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-400 text-center">{label}</label>
                  <input
                    type="text"
                    value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => {
                      setForm({ ...form, [key]: e.target.value });
                      const err = validatePillar(e.target.value);
                      setPillarErrors(prev => ({ ...prev, [key]: err || '' }));
                    }}
                    placeholder="甲子"
                    className={`bg-stone-50 border rounded-xl py-2.5 px-3 text-sm font-bold text-stone-700 text-center outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300 ${pillarErrors[key] ? 'border-rose-300 bg-rose-50/50' : 'border-stone-200'}`}
                  />
                  {pillarErrors[key] && (
                    <p className="text-[10px] text-rose-500 font-bold text-center">{pillarErrors[key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">反馈内容</label>
            <textarea
              value={form.feedback}
              onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              rows={12}
              placeholder="命例反馈/古籍记述..."
              className="mt-1.5 w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm leading-relaxed text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300 resize-y min-h-[240px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-400">原文链接</label>
            <input
              type="url"
              value={form.original_url}
              onChange={(e) => setForm({ ...form, original_url: e.target.value })}
              placeholder="https://..."
              className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
            />
          </div>

          <div className="border-t border-stone-100 pt-4">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">标签</label>
            <div className="mt-2 flex flex-col gap-2">
              {labelPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={pair.key}
                    onChange={(e) => onKeySelect(idx, e.target.value)}
                    className="w-[140px] flex-shrink-0 bg-stone-50 border border-stone-200 rounded-xl py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    <option value="">选择标签</option>
                    {LABEL_KEYS.filter((k) => !labelPairs.some((p, i) => i !== idx && p.key === k)).map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                    {pair.key && !LABEL_KEYS.includes(pair.key) && (
                      <option value={pair.key}>{pair.key}</option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => updateLabelPair(idx, 'value', e.target.value)}
                    placeholder="值"
                    className="flex-1 bg-stone-50 border border-stone-200 rounded-xl py-2 px-3 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeLabelPair(idx)}
                    className="p-2 text-stone-300 hover:text-rose-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLabelPair}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors self-start mt-1"
              >
                <Plus size={14} />
                添加标签
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2b2320] text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? '保存修改' : '创建命例'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/destiny-cases')}
              className="px-6 py-2.5 bg-stone-100 text-stone-500 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DestinyCaseFormPage;
