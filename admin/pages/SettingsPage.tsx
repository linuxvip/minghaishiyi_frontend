import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2, AlertCircle, Upload, ImageIcon } from 'lucide-react';
import { getSystemConfigsApi, updateSystemConfigsApi } from '../api/system-configs';
import { SystemConfigMap } from '../types/admin';
import { getAccessToken } from '../api/client';
import { useToast } from '../../components/Toast';

interface FieldMeta { key: keyof SystemConfigMap; label: string; placeholder: string; group: string; upload?: boolean; }

const FIELDS: FieldMeta[] = [
  { key: 'site_name', label: '网站名称', placeholder: '命海拾遗', group: '品牌信息' },
  { key: 'site_subtitle', label: '首页副标题', placeholder: '探索八字玄机', group: '品牌信息' },
  { key: 'footer_text', label: '页脚文案', placeholder: 'Ming Hai Shi Yi', group: '品牌信息' },
  { key: 'avatar_url', label: '作者头像', placeholder: '/avatar.jpg', group: '媒体资源', upload: true },
  { key: 'qrcode_url', label: '公众号二维码', placeholder: '/qrcode.jpg', group: '媒体资源', upload: true },
  { key: 'wx_qrcode_url', label: '个人微信二维码', placeholder: '/wx_qrcode.jpg', group: '媒体资源', upload: true },
];
const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [configs, setConfigs] = useState<SystemConfigMap>({ site_name: '', site_subtitle: '', footer_text: '', qrcode_url: '', avatar_url: '', wx_qrcode_url: '' });
  const [error, setError] = useState('');

  useEffect(() => { getSystemConfigsApi().then(({ data }) => setConfigs((prev) => ({ ...prev, ...data }))).catch(() => showToast('加载失败')).finally(() => setLoading(false)); }, []);

  const handleUpload = async (file: File, field: keyof SystemConfigMap): Promise<void> => { setUploading(String(field)); const fd = new FormData(); fd.append('file', file); try { const tok = getAccessToken(); const res = await fetch('/admin-api/upload/', { method: 'POST', body: fd, headers: tok ? { Authorization: 'Bearer ' + tok } : {} }); if (!res.ok) { showToast('上传失败'); return; } const { url } = await res.json(); setConfigs((prev) => ({ ...prev, [field]: url })); showToast('上传成功'); } catch { showToast('上传失败'); } finally { setUploading(null); } };

  const handleSave = async () => { setSaving(true); setError(''); try { await updateSystemConfigsApi(configs); showToast('已保存'); } catch { setError('保存失败'); } finally { setSaving(false); } };
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-stone-300" size={28} /></div>;

  const groups = ['品牌信息', '媒体资源'];
  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="text-xl font-bold text-stone-800 mb-6">系统设置</h1>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        {error && <div className="flex items-start gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold mb-4"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{error}</span></div>}
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">{group}</h3>
            {FIELDS.filter((f) => f.group === group).map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center gap-2"><label className="text-[10px] font-bold text-stone-400">{field.label}</label>{field.upload && <span className="text-[9px] text-amber-500">（可上传图片）</span>}</div>
                {field.upload && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors text-[10px] font-bold text-amber-700">
                      <Upload size={12} />
                      {uploading === field.key ? '上传中...' : '选择图片'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, field.key); }} disabled={uploading !== null} />
                    </label>
                    {configs[field.key] && (<div className="w-10 h-10 bg-stone-50 rounded-lg border border-stone-200 overflow-hidden flex-shrink-0"><img src={configs[field.key]} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>)}
                  </div>
                )}
                <input type="text" value={configs[field.key] || ''} onChange={(e) => setConfigs((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder={field.placeholder} className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300" />
              </div>
            ))}
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="mt-2 w-full py-3 bg-[#2b2320] text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">{saving ? <><Loader2 size={14} className="animate-spin" />保存中...</> : <><Save size={14} />保存设置</>}</button>
      </div>
    </div>
  );
};

export default SettingsPage;
