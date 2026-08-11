import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useUserAuth } from '../contexts/UserAuthContext';
import AuthModal from './AuthModal';
import { getFavoriteStatusApi, toggleFavoriteApi } from '../api/userApi';
import { FavoriteObjectType } from '../types';
import { useToast } from '../../components/Toast';

interface FavoriteButtonProps {
  objectType: FavoriteObjectType;
  objectId: number;
  size?: number;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ objectType, objectId, size = 16, className }) => {
  const { isAuthenticated } = useUserAuth();
  const { showToast } = useToast();
  const [favorited, setFavorited] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated) {
      getFavoriteStatusApi(objectType, objectId)
        .then((res) => { if (!cancelled) setFavorited(res.favorited); })
        .catch(() => {});
    } else {
      setFavorited(false);
    }
    return () => { cancelled = true; };
  }, [isAuthenticated, objectType, objectId]);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await toggleFavoriteApi(objectType, objectId);
      setFavorited(res.favorited);
      showToast(res.favorited ? '已收藏' : '已取消收藏');
    } catch {
      showToast('操作失败');
    } finally {
      setBusy(false);
    }
  }, [isAuthenticated, busy, objectType, objectId, showToast]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center justify-center rounded-full transition-all select-none ${
          favorited
            ? 'text-rose-500 bg-rose-50'
            : 'text-stone-300 hover:text-rose-400 hover:bg-rose-50/50'
        } ${className ?? ''}`}
        title={favorited ? '取消收藏' : '收藏'}
      >
        <Heart size={size} fill={favorited ? 'currentColor' : 'none'} />
      </button>
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
};

export default FavoriteButton;
