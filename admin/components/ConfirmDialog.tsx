import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  message = '确定要执行此操作吗？此操作不可撤销。',
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mb-4">
        <AlertTriangle size={24} />
      </div>
      <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
      <div className="flex gap-3 mt-6 w-full">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-60"
        >
          {loading ? '处理中...' : '确认'}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
