
import React from 'react';
import { MessageCircle, BookOpen, Search, Compass, Heart, Share2, Award, Target } from 'lucide-react';

const AuthorInfo: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-32 px-1">
      {/* 核心品牌卡片 */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-[#fbf9f4] -z-10"></div>
        
        {/* 头像/Logo */}
        <div className="w-24 h-24 bg-white rounded-full p-1 border border-stone-200 shadow-md mb-4 mt-6 flex items-center justify-center overflow-hidden">
           <div className="w-full h-full bg-[#2b2320] rounded-full flex items-center justify-center text-white text-3xl font-calligraphy">
             拾
           </div>
        </div>

        <h2 className="text-2xl font-bold text-stone-800 tracking-widest">命海拾遗</h2>
        <div className="flex items-center gap-2 mt-2 px-4 py-1 bg-stone-100 rounded-full">
          <MessageCircle size={14} className="text-stone-400" />
          <span className="text-[10px] font-bold text-stone-500 tracking-[0.2em] uppercase">Official Account</span>
        </div>

        <div className="w-12 h-[1px] bg-stone-200 my-8"></div>
        
        {/* 古风简介 */}
        <div className="space-y-2 mb-2">
          <p className="text-stone-800 leading-relaxed text-lg font-serif px-2 font-semibold">
            “承古启新，拾易海之遗珠；去伪存真，筑学理之门径。”
          </p>
          <p className="text-stone-500 leading-relaxed text-sm font-serif px-4">
            致力于分享逻辑严密、体系完备之命理真知。不求玄虚之辞，唯愿以实证求真道，引同好者共登玄学之堂奥。
          </p>
        </div>

        {/* 公众号二维码区域 */}
        <div className="mt-8 mb-4 p-2 bg-stone-50 rounded-3xl border border-stone-100 relative group cursor-pointer shadow-inner">
          <div className="w-44 h-44 bg-white rounded-2xl flex items-center justify-center border border-stone-100 overflow-hidden shadow-sm">
             <img 
               src="https://i.imgs.ovh/2025/12/30/C1wtZb.jpeg" 
               alt="命海拾遗公众号二维码" 
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
             />
          </div>
          <p className="mt-4 text-[10px] font-bold text-stone-400 tracking-[0.3em] uppercase">
            长按扫码 · 关注公众号
          </p>
        </div>
      </div>

      {/* 内容板块介绍 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <BookOpen size={18} />, title: "体系教程", color: "bg-amber-50 text-amber-700", desc: "底层逻辑拆解" },
          { icon: <Search size={18} />, title: "深度案例", color: "bg-emerald-50 text-emerald-700", desc: "实战抽丝剥茧" },
          { icon: <Compass size={18} />, title: "源流考据", color: "bg-sky-50 text-sky-700", desc: "古籍去伪存真" },
          { icon: <Share2 size={18} />, title: "同道切磋", color: "bg-rose-50 text-rose-700", desc: "高质量学研群" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col gap-2">
            <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
              {item.icon}
            </div>
            <div>
              <h4 className="font-bold text-stone-800 text-xs">{item.title}</h4>
              <p className="text-[10px] text-stone-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 统一浅色风格的底部左右板块 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左侧卡片：宗旨 - 改为浅色 */}
        <div className="bg-[#fcfaf2] rounded-[2rem] p-6 text-stone-800 flex flex-col gap-3 relative overflow-hidden group border border-amber-100/50 shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700 text-amber-900">
             <Award size={100} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
              <Target size={12} className="text-amber-700" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-800/60">宗旨</span>
          </div>
          <h3 className="text-sm font-bold text-stone-800">逻辑实证</h3>
          <p className="text-[11px] text-stone-500 leading-relaxed font-serif">
            拒绝盲从与迷信，以现代逻辑重构古典术数，使易理可学习、可复制、可证伪。
          </p>
        </div>

        {/* 右侧卡片：愿景 - 保持并优化浅色 */}
        <div className="bg-[#fcfaf2] rounded-[2rem] p-6 text-stone-800 flex flex-col gap-3 relative overflow-hidden group border border-rose-100/50 shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700 text-rose-900">
             <Heart size={100} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-rose-50 rounded-full flex items-center justify-center">
              <Heart size={12} className="text-rose-600" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-rose-800/60">愿景</span>
          </div>
          <h3 className="text-sm font-bold text-stone-800">拾遗明道</h3>
          <p className="text-[11px] text-stone-500 leading-relaxed font-serif">
            于浩瀚易海中拾捡真知，不为谋财，只为与同好者一同破除迷雾，见自性之光。
          </p>
        </div>
      </div>

      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2 text-stone-300 text-[10px] font-serif tracking-[0.4em] uppercase">
          <span>Ming Hai Shi Yi · 命海拾遗</span>
        </div>
      </div>
    </div>
  );
};

export default AuthorInfo;
