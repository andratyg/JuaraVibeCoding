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
    <header className="sticky top-0 z-30 h-14 lg:h-16 flex items-center justify-between px-4 md:px-6 bg-[#0D0F14]/90 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-[#6C63FF] rounded-lg flex items-center justify-center text-white text-xs font-bold">⚡</div>
          <span className="font-bold text-white text-sm">FlowState</span>
        </div>
        <h1 className="hidden lg:block text-white font-bold text-lg">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-white/40 text-sm hover:bg-white/8 transition-colors border border-white/8"
        >
          <Search size={14} />
          <span>Cari...</span>
          <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-2 font-mono">⌘K</kbd>
        </button>

        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
        >
          <Bell size={18} className="text-white/50" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0D0F14] shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          )}
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B8FFF] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20 ring-2 ring-white/5">
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
