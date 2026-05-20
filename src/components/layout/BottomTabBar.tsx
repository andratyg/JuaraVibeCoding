import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Zap, CheckSquare, BarChart3, MoreHorizontal, Dumbbell, BookOpen, FileText, Settings, User, LogOut } from 'lucide-react';
import { auth } from '../../config/firebase';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export default function BottomTabBar() {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/checkin', label: t('nav.checkin'), icon: Zap },
    { path: '/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { path: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
  ];

  const drawerItems = [
    { path: '/fitness', label: t('nav.fitness'), icon: Dumbbell },
    { path: '/journal', label: t('nav.journal'), icon: BookOpen },
    { path: '/summarizer', label: t('nav.summarizer'), icon: FileText },
    { path: '/profile', label: t('nav.profile'), icon: User },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around pb-[env(safe-area-inset-bottom)] pt-1 h-[72px] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {mainTabs.map(tab => (
          <NavLink 
            key={tab.path} 
            to={tab.path}
            className={({isActive}) => cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200",
              isActive ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-900 font-bold'
            )}
          >
            {({ isActive }) => (
              <>
                <tab.icon size={22} strokeWidth={isActive ? 3 : 2} />
                <span className={cn("text-[10px] font-black uppercase tracking-tighter", isActive ? "opacity-100" : "opacity-40")}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button 
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-slate-300 hover:text-slate-900 transition-colors"
        >
          < MoreHorizontal size={22} />
          <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">{t('nav.more')}</span>
        </button>
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="md:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[3rem] border-t border-slate-100 pb-[env(safe-area-inset-bottom)] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-4 pb-6">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-3 px-6 pb-10">
                {drawerItems.map(item => (
                  <NavLink 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 p-5 bg-slate-50 rounded-[1.5rem] text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
                  >
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                       <item.icon size={18} />
                    </div>
                    {item.label}
                  </NavLink>
                ))}
                <button 
                  onClick={() => {
                    auth.signOut();
                    setDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 p-5 bg-rose-50 rounded-[1.5rem] text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 shadow-sm col-span-2"
                >
                  <div className="p-2 bg-white text-rose-600 rounded-lg shadow-sm border border-rose-50">
                    <LogOut size={18} />
                  </div>
                  {t('auth.logout')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
