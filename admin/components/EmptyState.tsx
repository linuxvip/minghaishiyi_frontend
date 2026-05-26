import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message = '暂无数据', action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 mb-4">
      <Inbox size={28} />
    </div>
    <p className="text-sm font-bold text-stone-400">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
