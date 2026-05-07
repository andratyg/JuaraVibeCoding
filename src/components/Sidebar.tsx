import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Zap, CheckSquare, Dumbbell, 
  BookOpen, FileText, BarChart3, 
  Settings, Flame, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import ProfileDropdown from './ProfileDropdown';

const navItems = [
  { path: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, color: 'indigo' },
  { path: '/energy', labelKey: 'sidebar.energy', icon: Zap, color: 'amber' },
  { path: '/tasks', labelKey: 'sidebar.tasks', icon: CheckSquare, color: 'emerald' },
  { path: '/fitness', labelKey: 'sidebar.fitness', icon: Dumbbell, color: 'rose' },
  { path: '/journal', labelKey: 'sidebar.journal', icon: BookOpen, color: 'sky' },
  { path: '/summarizer', labelKey: 'sidebar.summarizer', icon: FileText, color: 'violet' },
  { path: '/analytics', labelKey: 'sidebar.analytics', icon: BarChart3, color: 'slate' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <aside className="relative flex h-full w-[104px] flex-col items-center border-r border-slate-200/40 bg-white/40 backdrop-blur-3xl py-12 justify-between transition-all z-50 overflow-visible">
      {/* Visual Accent - Top Gradient Flare */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="flex flex-col items-center gap-14 w-full relative z-10">
        {/* Brand Identity */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group cursor-pointer"
        >
            <div className="w-14 h-14 bg-slate-900 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl shadow-slate-900/10 group-hover:shadow-indigo-500/20 transition-all duration-500 overflow-hidden">
                <span className="text-2xl font-black italic tracking-tighter">F</span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" 
                  initial={false}
                />
            </div>
            <div className="absolute -inset-2 bg-indigo-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </motion.div>

        {/* Global Navigation */}
        <nav className="flex flex-col gap-4 w-full px-5 relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'relative group flex flex-col items-center justify-center w-full aspect-square rounded-[1.5rem] transition-all duration-300',
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-900/5'
                  )
                }
              >
                {/* Active Backdrop Capsule (Shared Layout) */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-[1.5rem] z-0"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <motion.div
                  whileHover={{ y: -2 }}
                  className="relative z-10"
                >
                  <item.icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-colors duration-300",
                      isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900"
                    )} 
                  />
                </motion.div>
                
                {/* Refined Technical Tooltip */}
                <div className="absolute left-full ml-6 px-4 py-2 bg-slate-900 text-white rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-2xl skew-x-[-2deg]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t(item.labelKey)}</p>
                  <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-slate-900 rotate-45 rounded-sm -z-10" />
                </div>

                {/* Status Indicator Bar */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      exit={{ scaleY: 0, opacity: 0 }}
                      className="absolute right-[-20px] top-1/4 bottom-1/4 w-1 bg-slate-900 rounded-full"
                    />
                  )}
                </AnimatePresence>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Persistent System Control */}
      <div className="flex flex-col items-center gap-10 relative z-10 w-full mb-2">
        <div className="h-px w-8 bg-slate-200/60" />
        <ProfileDropdown />
      </div>
    </aside>
  );
}

