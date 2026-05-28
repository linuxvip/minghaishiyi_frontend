import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // 路由切换时自动关闭移动端抽屉
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // 移动端抽屉打开时禁止 body 滚动
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen bg-stone-50">
      {/* ─── 桌面端侧边栏 ─── */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} variant="inline" />
      </div>

      {/* ─── 移动端遮罩 ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden transition-opacity"
          onClick={handleMobileClose}
        />
      )}

      {/* ─── 移动端抽屉 ─── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar collapsed={false} onToggle={handleMobileClose} variant="overlay" onNavClick={handleMobileClose} />
      </div>

      {/* ─── 主内容区 ─── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* 移动端顶栏 */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-stone-500 hover:text-stone-700 rounded-lg transition-colors"
            aria-label="打开菜单"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-calligraphy">命</span>
            </div>
            <span className="text-sm font-calligraphy tracking-wider text-[#2b2320]">命海拾遗</span>
          </div>
          {/* 占位保持居中 */}
          <div className="w-8" />
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
