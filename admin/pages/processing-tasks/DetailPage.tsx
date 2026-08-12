import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw } from 'lucide-react';
import { getProcessingTaskApi, processTaskApi } from '../../api/processing-tasks';
import { ProcessingTask } from '../../types/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../../components/Toast';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-stone-100 text-stone-600' },
  processing: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  done: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  failed: { label: '失败', className: 'bg-rose-100 text-rose-700' },
};

const ProcessingTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [task, setTask] = useState<ProcessingTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  const fetchTask = useCallback(async () => {
    try {
      const { data } = await getProcessingTaskApi(Number(id));
      setTask(data);
    } catch {
      showToast('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [task?.log]);

  useEffect(() => {
    if (!task || task.status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const { data } = await getProcessingTaskApi(Number(id));
        setTask(data);
      } catch { /* ignore */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, task?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await processTaskApi(Number(id));
      showToast('任务已开始处理');
      fetchTask();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || '启动失败';
      showToast(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="py-20"><LoadingSpinner /></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-20">
          <p className="text-stone-400 text-sm">任务不存在</p>
          <button onClick={() => navigate('/admin/processing-tasks')} className="mt-4 text-amber-600 text-sm font-bold hover:underline">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const elapsed = task.updated_at && task.created_at
    ? Math.round((new Date(task.updated_at).getTime() - new Date(task.created_at).getTime()) / 1000)
    : null;

  return (
    <div className="animate-fade-in">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/processing-tasks')}
          className="flex items-center gap-1.5 text-stone-500 hover:text-stone-700 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          {(task.status === 'pending' || task.status === 'failed') && (
            <button
              onClick={handleProcess}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors active:scale-95 disabled:opacity-60"
            >
              <Play size={14} />
              {processing ? '启动中...' : (task.status === 'failed' ? '重试' : '开始处理')}
            </button>
          )}
          {task.status !== 'processing' && (
            <button
              onClick={fetchTask}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-colors"
            >
              <RefreshCw size={14} />
              刷新
            </button>
          )}
        </div>
      </div>

      {/* 信息卡片 */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-bold text-stone-800 mb-3">任务信息</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400">状态</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${STATUS_CONFIG[task.status]?.className || ''} ${task.status === 'processing' ? 'animate-pulse' : ''}`}>
              {STATUS_CONFIG[task.status]?.label || task.status}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400">来源标签</span>
            <span className="text-sm font-bold text-stone-700">{task.source_name}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400">入库命例数</span>
            <span className="text-sm font-bold text-stone-700">{task.cases_created}</span>
          </div>
          {elapsed !== null && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400">处理耗时</span>
              <span className="text-sm font-bold text-stone-700">
                {elapsed >= 60 ? `${Math.floor(elapsed / 60)}分${elapsed % 60}秒` : `${elapsed}秒`}
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-stone-50">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-stone-400">文章链接</span>
            <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 hover:text-amber-800 break-all">
              {task.url}
            </a>
          </div>
        </div>
        {task.error_message && (
          <div className="mt-3 pt-3 border-t border-stone-50">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-rose-400">失败原因</span>
              <p className="text-xs text-rose-600">{task.error_message}</p>
            </div>
          </div>
        )}
      </div>

      {/* 日志区域 */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-800">处理日志</h2>
          {task.status === 'processing' && (
            <span className="text-[10px] text-stone-400 animate-pulse">自动刷新中...</span>
          )}
        </div>
        <pre
          ref={logRef}
          className="bg-stone-900 text-green-400 p-4 overflow-auto max-h-[60vh] font-mono text-sm leading-relaxed whitespace-pre-wrap"
        >
          {task.log || '暂无日志...'}
        </pre>
      </div>

      {/* 底部统计 */}
      <div className="mt-4 flex items-center gap-4 text-xs text-stone-400">
        <span>提交时间: {new Date(task.created_at).toLocaleString('zh-CN')}</span>
        <span>更新时间: {new Date(task.updated_at).toLocaleString('zh-CN')}</span>
      </div>
    </div>
  );
};

export default ProcessingTaskDetailPage;
