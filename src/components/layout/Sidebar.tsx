import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, CheckSquare, Dumbbell, BookOpen, FileText, BarChart3, LogOut } from 'lucide-react';
import { auth } from '../../config/firebase';
import { useApp } from '../../App';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import ProfileDropdown from './ProfileDropdown';

const navItems = [
  { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/energy', labelKey: 'sidebar.energy', icon: Zap },
  { path: '/tasks', labelKey: 'sidebar.tasks', icon: CheckSquare },
  { path: '/fitness', labelKey: 'sidebar.fitness', icon: Dumbbell },
  { path: '/journal', labelKey: 'sidebar.journal', icon: BookOpen },
  { path: '/summarizer', labelKey: 'sidebar.summarizer', icon: FileText },
  { path: '/analytics', labelKey: 'sidebar.analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const { profile } = useApp();
  const { t } = useTranslation();

  return (
    <aside className="flex h-full w-24 flex-col items-center border-r border-slate-100 bg-white/80 backdrop-blur-xl py-10 justify-between transition-all z-50">
      <div className="flex flex-col items-center gap-12 w-full">
        {/* Logo */}
        <div className="relative group">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform cursor-pointer overflow-hidden">
                <span className="relative z-10">P</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -inset-1 bg-slate-900/5 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <nav className="flex flex-col gap-3 w-full px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'relative group flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all duration-500',
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <item.icon className="h-6 w-6 relative z-10" />
              
              {/* Tooltip on Hover */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-2xl">
                {t(item.labelKey)}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>

              {/* Active Indicator Dot */}
              <div className={cn(
                  "absolute bottom-2 h-1 w-1 rounded-full bg-indigo-400 transition-all scale-0",
                  "group-hover:scale-100"
              )} />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-8">
        <ProfileDropdown />
      </div>
    </aside>
  );
}
