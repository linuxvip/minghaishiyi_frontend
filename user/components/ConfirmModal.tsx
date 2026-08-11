import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确认删除',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-[#fdfcf8] w-full max-w-sm rounded-t-[2.5rem] md:rounded-[1.75rem] shadow-2xl overflow-hidden animate-slide-up border-t border-stone-200 p-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-400">
            <AlertTriangle size={22} />
          </div>
          <h3 className="text-base font-bold text-stone-800 mt-1">{title}</h3>
          {message && <p className="text-xs text-stone-400 leading-relaxed">{message}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-stone-100 text-stone-500 rounded-full text-sm font-bold active:scale-95 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-rose-500 text-white rounded-full text-sm font-bold shadow-md active:scale-95 transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmModal;
