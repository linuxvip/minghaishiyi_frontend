import React, { useState } from 'react';
import { BookmarkPlus, Loader2 } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import AuthModal from './AuthModal';
import { createUserCaseApi } from '../api/userApi';
import { BaZiChart, Gender } from '../../types';
import { useToast } from '../../components/Toast';

interface SaveCaseBarProps {
  chart: BaZiChart;
  inputSnapshot: Record<string, unknown>;
}

const SaveCaseBar: React.FC<SaveCaseBarProps> = ({ chart, inputSnapshot }) => {
  const { isAuthenticated } = useUserAuth();
  const { showToast } = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    if (saving || saved) return;
    setSaving(true);
    try {
      const res = await createUserCaseApi({
        gender: chart.gender === Gender.MALE ? 1 : 0,
        year_ganzhi: chart.year.gan + chart.year.zhi,
        month_ganzhi: chart.month.gan + chart.month.zhi,
        day_ganzhi: chart.day.gan + chart.day.zhi,
        hour_ganzhi: chart.hour.gan + chart.hour.zhi,
        subject_name: chart.name || '',
        notes: chart.caseFeedback || '',
        input_snapshot: inputSnapshot,
      });
      setSaved(true);
      showToast(res.created ? '已保存到我的案例' : '该命盘已在你的案例中，已更新信息');
    } catch {
      showToast('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={saving || saved}
        className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all border ${
          saved
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'bg-white text-[#b39b7d] border-[#e6d8c3] hover:border-[#b39b7d] hover:bg-amber-50/50'
        } disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <BookmarkPlus size={16} />
        )}
        {saved ? '已保存' : saving ? '保存中...' : '保存到我的案例'}
      </button>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="register"
      />
    </>
  );
};

export default SaveCaseBar;
