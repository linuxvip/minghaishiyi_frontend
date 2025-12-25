
import React from 'react';
import { BookOpen, Quote } from 'lucide-react';

interface AnalysisResultProps {
  caseFeedback?: string;
  caseSource?: string;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ caseFeedback, caseSource }) => {
  // 如果既没有历史反馈，也没有其他内容展示，则不渲染组件
  if (!caseFeedback) return null;

  return (
    <div className="mt-8 flex flex-col gap-6 mb-12">
      {/* 命例库反馈板块 */}
      <div className="bg-amber-50/50 rounded-3xl border border-amber-200/50 p-6 md:p-8 animate-fade-in relative overflow-hidden group">
         <Quote className="absolute -top-2 -right-2 text-amber-200/30 w-24 h-24 rotate-12 group-hover:scale-110 transition-transform" />
         <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-900">
              <BookOpen size={20} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-amber-900">古籍记述 / 实务反馈</h3>
              <span className="text-[10px] text-amber-700/60 uppercase tracking-widest font-bold">Source: {caseSource}</span>
            </div>
         </div>
         <div className="relative z-10">
            {/* 修改点：去除 italic 类，去除引号包裹 */}
            <p className="text-stone-700 leading-relaxed text-lg font-serif">
              {caseFeedback}
            </p>
         </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
