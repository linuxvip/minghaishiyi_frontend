
import React from 'react';
import { Github, Mail, ShieldCheck, Heart, Coffee } from 'lucide-react';

const AuthorInfo: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-stone-100 -z-10"></div>
        <div className="w-24 h-24 bg-white rounded-full p-1 border border-stone-200 shadow-md mb-4 mt-4">
           <div className="w-full h-full bg-[#2b2320] rounded-full flex items-center justify-center text-white text-3xl font-calligraphy">
             拾
           </div>
        </div>
        <h2 className="text-2xl font-bold text-stone-800">命海拾遗</h2>
        <p className="text-stone-400 text-sm mt-1 font-serif italic">专注传统命理文化与现代科技的融合</p>
        
        <div className="w-12 h-[1px] bg-stone-200 my-6"></div>
        
        <p className="text-stone-600 leading-relaxed text-sm max-w-sm">
          “命海拾遗”致力于通过算法还原古籍中的命理逻辑，
          在数字时代为研究者提供更精准、便捷的推演工具。
          愿以此微光，照亮求知之路。
        </p>

        <div className="flex gap-4 mt-8">
          <button className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-[#2b2320] transition-colors border border-stone-100">
            <Github size={20} />
          </button>
          <button className="p-3 bg-stone-50 rounded-full text-stone-400 hover:text-[#2b2320] transition-colors border border-stone-100">
            <Mail size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-700">
            <ShieldCheck size={20} />
          </div>
          <h4 className="font-bold text-stone-800 text-sm">隐私保护</h4>
          <p className="text-xs text-stone-400 leading-tight">所有排盘数据仅限本地运行，不保存至任何服务器。</p>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
            <Coffee size={20} />
          </div>
          <h4 className="font-bold text-stone-800 text-sm">支持作者</h4>
          <p className="text-xs text-stone-400 leading-tight">如果您觉得好用，可以分享给志同道合的朋友。</p>
        </div>
      </div>

      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 text-stone-300 text-xs font-serif italic">
          <Heart size={10} fill="currentColor" />
          <span>静心研究 · 慎独守诚</span>
        </div>
      </div>
    </div>
  );
};

export default AuthorInfo;
