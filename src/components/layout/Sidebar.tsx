import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Zap, CheckSquare, Dumbbell, BookOpen, 
  FileText, BarChart3, ChevronRight, Search, Bell, Menu, X,
  MoreHorizontal, Settings, User as UserIcon
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { useApp } from '../../App';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

export const navItems = [
  { path: '/', label: 'Utama', icon: LayoutDashboard, category: 'MAIN' },
  { path: '/energy', label: 'Kalibrasi', icon: Zap, category: 'TOOLS' },
  { path: '/tasks', label: 'Tugas', icon: CheckSquare, category: 'TOOLS' },
  { path: '/fitness', label: 'Fitness', icon: Dumbbell, category: 'TOOLS' },
  { path: '/journal', label: 'Jurnal', icon: BookOpen, category: 'TOOLS' },
  { path: '/summarizer', label: 'Summary', icon: FileText, category: 'TOOLS' },
  { path: '/analytics', label: 'Analitik', icon: BarChart3, category: 'MAIN' },
];

export default function Sidebar() {
  const { profile, user } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const categories = ['MAIN', 'TOOLS'];

  return (
    <>
      {/* MODE DESKTOP (lg: 1024px+) */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-white border-r border-slate-100 z-40 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-50 flex-shrink-0">
          <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-100">⚡</div>
          <span className="font-black text-slate-900 text-[15px] tracking-tight uppercase">FlowState</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {categories.map(cat => (
            <div key={cat} className="space-y-1">
              <p className="text-[10px] font-black text-slate-300 tracking-widest uppercase px-3 mb-2">{cat}</p>
              {navItems.filter(item => item.category === cat).map(item => (
                <NavLink 
                  key={item.path} 
                  to={item.path}
                  className={({isActive}) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                    isActive ? 'bg-[#6C63FF] text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-4 px-5 py-5 border-t border-slate-50 group/user">
          <div 
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FFF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer shadow-lg"
          >
            {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/profile')}>
            <p className="text-slate-900 text-xs font-black truncate">{profile?.displayName || 'User'}</p>
            <p className="text-slate-400 text-[9px] font-bold truncate uppercase tracking-tighter">{user?.email}</p>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-300 hover:text-slate-900 transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* MODE TABLET (md: 768px - lg: 1023px) */}
      <aside className="hidden md:flex lg:hidden flex-col fixed left-0 top-0 bottom-0 w-[52px] bg-white border-r border-slate-100 z-40">
        <div className="flex items-center justify-center h-16 border-b border-slate-50 flex-shrink-0">
          <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-100">⚡</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col items-center gap-1">
          {navItems.map(item => (
            <div key={item.path} className="relative group">
              <NavLink 
                to={item.path}
                className={({isActive}) => cn(
                  "flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
                  isActive ? 'bg-[#6C63FF] text-white shadow-lg shadow-indigo-100' : 'text-slate-300 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <item.icon size={18} />
              </NavLink>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50 shadow-2xl">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900"></div>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-col items-center py-4 border-t border-slate-50 gap-3">
          <div 
            onClick={() => navigate('/profile')}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FFF] flex items-center justify-center text-white text-xs font-bold cursor-pointer shadow-md"
          >
            {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
