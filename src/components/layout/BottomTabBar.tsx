import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, CheckSquare, BarChart3, MoreHorizontal, Dumbbell, BookOpen, FileText, Settings, User, LogOut } from 'lucide-react';
import { auth } from '../../config/firebase';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

const mainTabs = [
  { path: '/', label: 'Feed', icon: LayoutDashboard },
  { path: '/energy', label: 'Energy', icon: Zap },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/analytics', label: 'Stats', icon: BarChart3 },
];

const drawerItems = [
  { path: '/fitness', label: 'Fitness Coach', icon: Dumbbell },
  { path: '/journal', label: 'Reflection', icon: BookOpen },
  { path: '/summarizer', label: 'AI Summary', icon: FileText },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomTabBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0F14]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around pb-[env(safe-area-inset-bottom)] pt-1">
        {mainTabs.map(tab => (
          <NavLink 
            key={tab.path} 
            to={tab.path}
            className={({isActive}) => cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200",
              isActive ? 'text-[#A89BFF]' : 'text-white/35 hover:text-white/60'
            )}
          >
            <tab.icon size={22} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}

        <button 
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-white/35 hover:text-white/60 transition-colors"
        >
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-medium">Lainnya</span>
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
              className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-[#13161D] rounded-t-[2rem] border-t border-white/10 pb-[env(safe-area-inset-bottom)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-6">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-3 px-4 pb-8">
                {drawerItems.map(item => (
                  <NavLink 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl text-white/70 text-sm font-bold hover:bg-white/8 transition-colors border border-white/5"
                  >
                    <item.icon size={18} className="text-[#A89BFF]" />
                    {item.label}
                  </NavLink>
                ))}
                <button 
                  onClick={() => {
                    auth.signOut();
                    setDrawerOpen(false);
                  }}
                  className="flex items-center gap-3 p-4 bg-rose-500/10 rounded-2xl text-rose-500 text-sm font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
