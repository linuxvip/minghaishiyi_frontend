import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Upload, Image, X } from 'lucide-react';
import { getArticleApi, createArticleApi, updateArticleApi } from '../../api/articles';
import { getFormErrorMessage } from '../../utils/errors';
import { useToast } from '../../../components/Toast';
import { getAccessToken } from '../../api/client';

const ArticleFormPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    title: '',
    url: '',
    cover_url: '',
    summary: '',
    category: '',
    source: '',
    tags: '',
    sort_order: 0,
    is_published: true,
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getArticleApi(Number(id))
        .then(({ data }) => {
          setForm({
            title: data.title || '',
            url: data.url || '',
            cover_url: data.cover_url || '',
            summary: data.summary || '',
            category: data.category || '',
            source: data.source || '',
            tags: data.tags || '',
            sort_order: data.sort_order ?? 0,
            is_published: data.is_published,
          });
        })
        .catch(() => showToast('加载文章信息失败'))
        .finally(() => setLoading(false));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUploadCover = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = getAccessToken();
      const resp = await fetch('/admin-api/upload/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) throw new Error('上传失败');
      const { url } = await resp.json();
      setForm({ ...form, cover_url: url });
      showToast('封面上传成功');
    } catch {
      showToast('封面上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setForm({ ...form, cover_url: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      showToast('请填写必填字段：标题和链接');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: form.title.trim(),
        url: form.url.trim(),
        cover_url: form.cover_url.trim() || undefined,
        summary: form.summary.trim() || undefined,
        category: form.category.trim() || undefined,
        source: form.source.trim() || undefined,
        tags: form.tags.trim() || undefined,
        sort_order: form.sort_order,
        is_published: form.is_published,
      };
      if (isEdit) {
        await updateArticleApi(Number(id), payload);
        showToast('文章已更新');
      } else {
        await createArticleApi(payload);
        showToast('文章已创建');
      }
      navigate('/admin/articles');
    } catch (err) {
      setFormError(getFormErrorMessage(err));
    } finally {
      setSaving(false);
    }
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
        onClick={() => navigate('/admin/articles')}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="text-xs font-bold">返回文章列表</span>
      </button>

      <h1 className="text-xl font-bold text-stone-800 mb-6">{isEdit ? '编辑文章' : '新建文章'}</h1>

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
                标题 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="文章标题"
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                链接 <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
          </div>

          {/* 封面图：上传 + URL 输入 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">封面图</label>
            {form.cover_url ? (
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
                <img
                  src={form.cover_url}
                  alt="封面预览"
                  className="w-16 h-16 rounded-lg object-cover bg-stone-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={form.cover_url}
                    onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                    placeholder="封面图 URL 或上传路径"
                    className="w-full bg-transparent text-xs font-bold text-stone-700 outline-none placeholder:text-stone-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="p-1.5 text-stone-300 hover:text-rose-500 transition-colors flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadCover}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 hover:border-stone-300 transition-colors active:scale-95 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploading ? '上传中...' : '上传图片'}
                </button>
                <span className="text-[10px] text-stone-300">或</span>
                <input
                  type="text"
                  value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                  placeholder="直接输入图片URL"
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-xs font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">摘要</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={4}
              placeholder="文章摘要/简介（可选）"
              className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">分类</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="如：命理基础、案例分析（可选）"
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">来源/作者</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="文章来源或作者（可选）"
                className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">标签</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder='JSON 格式如：["八字","基础"] 或逗号分隔（可选）'
              className="bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200 placeholder:text-stone-300"
            />
          </div>

          <div className="border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">排序权重</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className="w-24 bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-amber-200"
                />
                <p className="text-[10px] text-stone-300">数值越大越靠前</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">是否显示</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
                    form.is_published ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      form.is_published ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold ${form.is_published ? 'text-emerald-600' : 'text-stone-400'}`}>
                  {form.is_published ? '显示' : '隐藏'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#2b2320] text-white rounded-xl text-sm font-bold hover:bg-stone-700 transition-colors active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? '保存修改' : '创建文章'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/articles')}
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

export default ArticleFormPage;
