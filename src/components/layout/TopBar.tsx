import React, { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { Search, Bell, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SearchOverlay from './SearchOverlay';
import NotificationDrawer from './NotificationDrawer';

export default function TopBar() {
  const { profile, user } = useApp();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Performance Peak', message: 'You reached 90% Wellness Index yesterday! High work output expected.', type: 'success' as const, time: '2h ago', read: false },
    { id: '2', title: 'Energy Check-in', message: 'Time for your afternoon recalibration. Stay sharp.', type: 'info' as const, time: '3h ago', read: false },
    { id: '3', title: 'System Protocol', message: 'Your weekly analytics report is now ready for review.', type: 'warning' as const, time: '5h ago', read: true },
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/energy': return 'Daily Calibration';
      case '/tasks': return 'Task Manager';
      case '/fitness': return 'Fitness Coach';
      case '/journal': return 'Reflection Journal';
      case '/summarizer': return 'AI Summarizer';
      case '/analytics': return 'Performance Analytics';
      case '/profile': return 'User Profile';
      default: return 'FlowState';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-14 lg:h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-[#6C63FF] rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-100">⚡</div>
          <span className="font-black text-slate-900 text-sm italic tracking-tighter uppercase">FlowState</span>
        </div>
        <h1 className="hidden lg:block text-slate-900 font-black text-lg uppercase tracking-tight">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-400 text-sm hover:bg-slate-100 transition-colors border border-slate-100"
        >
          <Search size={14} />
          <span className="font-bold">Cari...</span>
          <kbd className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-100 ml-2 font-black shadow-sm tracking-widest uppercase">⌘K</kbd>
        </button>

        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 hover:shadow-sm"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[8px] font-black rounded-full border-2 border-white shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FFF] flex items-center justify-center text-white text-xs font-bold shadow-lg ring-2 ring-white">
          {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
        </div>
      </div>

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      <NotificationDrawer 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
      />
    </header>
  );
}
