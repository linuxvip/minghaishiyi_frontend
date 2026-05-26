import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Library, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ConfirmDialog from './ConfirmDialog';

const navItems = [
  { to: '/admin/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/destiny-cases', label: '命例管理', icon: Library },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div
      className={`${
        collapsed ? 'w-[68px]' : 'w-60'
      } h-screen bg-white border-r border-stone-200 flex flex-col flex-shrink-0 transition-all duration-300 relative`}
    >
      {/* Logo */}
      <div className={`p-5 border-b border-stone-100 ${collapsed ? 'px-3 text-center' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 animate-glow-pulse">
            <span className="text-white text-sm font-bold font-calligraphy">命</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-lg font-calligraphy tracking-wider text-[#2b2320] whitespace-nowrap">命海拾遗</h2>
              <p className="text-[10px] text-stone-400 tracking-widest">管理后台</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 shadow-sm transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                collapsed ? 'justify-center px-2' : ''
              } ${
                isActive
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700 border border-transparent'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={`p-4 border-t border-stone-100 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-xs font-bold text-stone-500 flex-shrink-0">
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-700 truncate">{user?.username || '未知'}</p>
              <p className="text-[10px] text-stone-400 truncate">
                {user?.is_superuser ? '超级管理员' : user?.is_staff ? '管理员' : '用户'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="退出登录"
        >
          <LogOut size={14} />
          {!collapsed && '退出登录'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="退出登录"
        message="确定要退出登录吗？"
      />
    </div>
  );
};

export default Sidebar;
