import React from 'react';
import { BookOpen, Search, Compass, Share2, QrCode } from 'lucide-react';

import { useConfig } from '../admin/contexts/ConfigContext';
const AuthorInfo: React.FC = () => {
  const config = useConfig();
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-32 px-1">
      {/* 1. 核心品牌卡片 — 精简：头像 + 名称 + 简介 + 宗旨愿景 */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm flex flex-col items-center text-center">
        {/* 头像 */}
        <div className="w-24 h-24 bg-white rounded-full p-1 border border-stone-200 shadow-md mb-4 mt-2 flex items-center justify-center overflow-hidden">
           <img
             src={config.avatar_url}
             alt={config.site_name}
             className="w-full h-full object-cover rounded-full"
             onError={(e) => {
               const target = e.currentTarget;
               target.style.display = 'none';
               target.parentElement!.innerHTML = '<div class="w-full h-full bg-[#2b2320] rounded-full flex items-center justify-center text-white text-3xl font-calligraphy">拾</div>';
             }}
           />
        </div>

        <h2 className="text-2xl font-bold text-stone-800 tracking-widest">{config.site_name}</h2>

        <div className="w-12 h-[1px] bg-stone-200 my-6"></div>

        {/* 古风简介 */}
        <div className="mb-4 text-lg font-serif font-semibold text-stone-800 leading-relaxed px-2">
          <p>"承古启新，拾易海之遗珠；</p>
          <p>去伪存真，筑学理之门径。"</p>
        </div>

      </div>

      {/* 二维码 — 公众号 + 个人微信并排 */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-stone-200 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2"><QrCode size={16} className="text-amber-600" /><span className="text-xs font-bold text-amber-700 tracking-widest">关注公众号</span></div>
            <div className="w-12 h-[1px] bg-amber-200 mb-4"></div>
            <div className="w-36 h-36 md:w-44 md:h-44 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden mb-4"><img src={config.qrcode_url} alt="公众号" className="w-full h-full object-cover" /></div>
            <p className="text-sm font-bold text-stone-700">长按识别关注</p>
            <p className="text-[10px] text-stone-400 mt-1">教程·案例·考据</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-emerald-600 tracking-widest mb-2">个人微信</span>
            <div className="w-12 h-[1px] bg-emerald-200 mb-4"></div>
            <div className="w-36 h-36 md:w-44 md:h-44 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden mb-4"><img src={config.wx_qrcode_url} alt="微信" className="w-full h-full object-cover" /></div>
            <p className="text-sm font-bold text-stone-600">扫码添加微信</p>
            <p className="text-[10px] text-stone-400 mt-1">命理交流·深度咨询</p>
          </div>
        </div>
      </div>
      {/* 3. 内容板块介绍 — 含 hover 微交互 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <BookOpen size={18} />, title: "体系教程", color: "bg-amber-50 text-amber-700", desc: "底层逻辑拆解" },
          { icon: <Search size={18} />, title: "深度案例", color: "bg-emerald-50 text-emerald-700", desc: "实战抽丝剥茧" },
          { icon: <Compass size={18} />, title: "源流考据", color: "bg-sky-50 text-sky-700", desc: "古籍去伪存真" },
          { icon: <Share2 size={18} />, title: "同道切磋", color: "bg-rose-50 text-rose-700", desc: "高质量学研群" }
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-stone-200 cursor-default"
          >
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

      {/* 底部 */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 text-stone-300 text-[10px] font-serif tracking-[0.4em] uppercase">
          <span>{config.footer_text}</span>
        </div>
      </div>
    </div>
  );
};

export default AuthorInfo;
