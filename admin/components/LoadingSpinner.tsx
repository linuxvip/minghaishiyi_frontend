import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <div className="w-8 h-8 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
    <span className="text-sm text-stone-400">加载中...</span>
  </div>
);

export default LoadingSpinner;
