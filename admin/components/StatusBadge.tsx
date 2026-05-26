import React from 'react';

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ active, activeLabel = '激活', inactiveLabel = '禁用' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'
    }`}
  >
    {active ? activeLabel : inactiveLabel}
  </span>
);

export default StatusBadge;
