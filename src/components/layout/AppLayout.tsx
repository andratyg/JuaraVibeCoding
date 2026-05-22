import { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Zap, CheckSquare, Dumbbell, BookOpen, 
  BarChart2, FileText, MessageCircle, Settings, MoreHorizontal, 
  Bell, Search, User as UserIcon, LogOut, ChevronRight, Menu, Sun, Moon
} from 'lucide-react';
import { useApp } from '../../App';
import { auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import SearchOverlay from './SearchOverlay';
import NotificationDrawer from './NotificationDrawer';

const AppLayout = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, vibeMode, theme, setTheme } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Puncak Performa', message: 'Anda mencapai 90% Indeks Kesehatan kemarin! Output kerja tinggi diharapkan.', type: 'success' as const, time: '2j lalu', read: false },
    { id: '2', title: 'Cek Energi', message: 'Waktunya untuk kalibrasi sore Anda. Tetap fokus.', type: 'info' as const, time: '3j lalu', read: false },
    { id: '3', title: 'Protokol Sistem', message: 'Laporan analitik mingguan Anda sekarang siap untuk ditinjau.', type: 'warning' as const, time: '5j lalu', read: true },
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const mainNavItems = useMemo(() => [
    { path: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/checkin',   icon: Zap,             key: 'checkin' },
    { path: '/tasks',     icon: CheckSquare,     key: 'tasks' },
    { path: '/fitness',   icon: Dumbbell,        key: 'fitness' },
    { path: '/journal',   icon: BookOpen,        key: 'journal' },
  ], []);

  const toolsNavItems = useMemo(() => [
    { path: '/analytics',  icon: BarChart2,     key: 'analytics' },
    { path: '/summarizer', icon: FileText,      key: 'summarizer' },
    { path: '/coach',      icon: MessageCircle, key: 'coach' },
    { path: '/settings',   icon: Settings,      key: 'settings' },
  ], []);

  const bottomTabs = useMemo(() => mainNavItems.slice(0, 4), [mainNavItems]);
  const allItems = useMemo(() => [...mainNavItems, ...toolsNavItems], [mainNavItems, toolsNavItems]);
  
  const currentItem = allItems.find(i => location.pathname.startsWith(i.path));
  const pageTitle = currentItem ? t(`nav.${currentItem.key}`) : 'Velora';

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success(t('auth.logoutSuccess') || 'Sesi berakhir. Sampai jumpa!');
      navigate('/login');
    } catch (error) {
      toast.error('Gagal keluar');
    }
  };

  const currentVibe = vibeMode || 'balance';
  const vibeInfo = {
    'deep-work': { color: '#1DB97A', label: t('checkin.deepWork'), icon: Zap },
    'recovery':  { color: '#5296F1', label: t('checkin.recovery'),   icon: BookOpen },
    'balance':   { color: '#8B5CF6', label: t('checkin.balance'),   icon: BarChart2 }
  }[currentVibe] || { color: '#8B5CF6', label: t('checkin.balance'), icon: BarChart2 };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-[var(--accent)] selection:text-white">
      
      {/* ── 1. DESKTOP SIDEBAR (lg: 1024px+) ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] bg-[var(--bg)] border-r border-[var(--border)] z-40">
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/10" style={{ background: 'var(--accent)' }}>
              <Zap size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">Velora</span>
          </div>

          {/* Vibe Indicator */}
          <div className="mb-8 p-4 rounded-2xl border bg-[var(--surface)]" style={{ borderColor: `${vibeInfo.color}33` }}>
            <div className="flex items-center gap-2 mb-2">
               <vibeInfo.icon size={14} style={{ color: vibeInfo.color }} />
               <span className="text-[10px] font-black tracking-widest uppercase italic" style={{ color: vibeInfo.color }}>
                 {vibeInfo.label}
               </span>
            </div>
            <div className="h-1 w-full bg-[var(--border2)] rounded-full overflow-hidden">
               <motion.div className="h-full" style={{ background: vibeInfo.color }} initial={{ width: 0 }} animate={{ width: '70%' }} />
            </div>
          </div>

          <nav className="space-y-1">
            {mainNavItems.map(item => (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                  ${isActive ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text2)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}
                `}>
                <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="my-6 h-px bg-[var(--border)]" />

          <nav className="space-y-1">
             {toolsNavItems.map(item => (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text2)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}
                `}>
                <item.icon size={18} />
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="shrink-0 mt-auto p-4 border-t border-[var(--border)]">
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-3 w-full p-2 hover:bg-[var(--surface)] rounded-xl transition-colors">
            <div className="shrink-0 w-10 h-10 rounded-full border-2 border-[var(--border2)] overflow-hidden bg-[var(--surface2)] flex items-center justify-center text-[var(--text)] font-bold">
              {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : profile?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-xs font-bold truncate">{profile?.displayName}</p>
              <p className="text-[10px] text-[var(--text3)] truncate">{profile?.email}</p>
            </div>
            <ChevronRight size={14} className="shrink-0 ml-auto text-[var(--text3)]" />
          </button>
        </div>
      </aside>

      {/* ── 2. TABLET RAIL (md: 768px - 1023px) ── */}
      <aside className="hidden md:flex lg:hidden flex-col fixed left-0 top-0 bottom-0 w-[72px] bg-[var(--bg)] border-r border-[var(--border)] z-40 items-center py-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shrink-0 mb-6">
          <Zap size={20} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar w-full px-3 mb-6 items-center">
          {allItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `
                shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all
                ${isActive ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text2)] hover:bg-[var(--surface)]'}
              `}>
              <item.icon size={20} />
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto shrink-0 w-full flex justify-center px-4">
          <button onClick={() => setProfileOpen(true)} className="w-10 h-10 rounded-full bg-[var(--surface2)] border-2 border-[var(--border2)] overflow-hidden flex items-center justify-center text-[var(--text)] font-bold">
            {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : profile?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
          </button>
        </div>
      </aside>

      {/* ── MAIN VIEW ── */}
      <main className="ml-0 md:ml-[72px] lg:ml-[240px] flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
           <div className="flex items-center gap-4">
              <button className="md:hidden p-2 -ml-2 text-[var(--text2)]" onClick={() => setDrawerOpen(true)}>
                <Menu size={20} />
              </button>
              <h1 className="font-bold text-lg">{pageTitle}</h1>
           </div>

           <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-[var(--text3)] hover:text-[var(--text)] transition-colors rounded-full lg:bg-[var(--surface)] lg:border lg:border-[var(--border)] lg:px-3 lg:py-1.5 flex items-center justify-center gap-2"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span className="hidden lg:block text-xs font-semibold">TEMA</span>
              </button>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center px-4 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
               >
                  <Search size={14} className="mr-2" /> {t('common.search')}
                  <span className="ml-4 opacity-30">⌘K</span>
              </button>
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 text-[var(--text3)] hover:text-[var(--text)] transition-colors"
               >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full border-2 border-[var(--bg)] bg-red-500" />
                )}
              </button>
           </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-5 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
           <Outlet />
        </div>
      </main>

      {/* ── 3. MOBILE BOTTOM NAV (sm: < 768px) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-[var(--surface2)]/90 backdrop-blur-2xl border-t border-[var(--border)] z-50 flex items-center justify-around px-2 shadow-2xl shadow-black/10 dark:shadow-black/40">
        {bottomTabs.map(tab => (
          <NavLink key={tab.path} to={tab.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 transition-all min-w-[56px] min-h-[44px]
              ${isActive ? 'text-[var(--accent)] scale-110' : 'text-[var(--text3)]'}
            `}>
            {({ isActive }) => (
              <>
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-[var(--accent)]" />}
              </>
            )}
          </NavLink>
        ))}
        <button onClick={() => setDrawerOpen(true)} className="flex flex-col items-center justify-center gap-1 text-[var(--text3)] min-w-[56px] min-h-[44px]">
           <MoreHorizontal size={22} />
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div className="fixed inset-0 z-[60] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setDrawerOpen(false)} />
             <motion.div className="absolute bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] rounded-t-[40px] p-8"
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}>
                <div className="w-12 h-1.5 bg-[var(--border2)] rounded-full mx-auto mb-8" />
                <div className="grid grid-cols-2 gap-4">
                  {toolsNavItems.map(item => (
                    <button key={item.path} onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-[var(--surface2)] border border-[var(--border)] text-sm font-bold">
                      <div className="p-3 bg-[var(--accent-bg)] text-[var(--accent)] rounded-2xl">
                        <item.icon size={20} />
                      </div>
                      {t(`nav.${item.key}`)}
                    </button>
                  ))}
                  <button onClick={handleLogout} className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-500">
                      <div className="p-3 bg-red-500/20 rounded-2xl text-red-500">
                        <LogOut size={20} />
                      </div>
                      {t('auth.logout')}
                  </button>
                </div>

                <div className="mt-8 pt-8 border-t border-[var(--border)]">
                   <div className="flex gap-2 bg-[var(--surface2)] p-1.5 rounded-2xl border border-[var(--border)]">
                      {['id', 'en'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => i18n.changeLanguage(lang)}
                          className={cn(
                            "flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                            i18n.language === lang ? "bg-[var(--accent)] text-white shadow-lg" : "text-[var(--text3)]"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Overlay */}
      <AnimatePresence>
        {profileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileOpen(false)} />
             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-sm bg-[var(--surface2)] rounded-[40px] border border-[var(--border)] p-10 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[40px] bg-[var(--surface2)] p-1 shadow-2xl mb-6">
                    <div className="w-full h-full rounded-[36px] bg-[var(--surface2)] overflow-hidden flex items-center justify-center text-3xl font-black text-[var(--accent)] border border-[var(--border)]">
                      {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : profile?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{profile?.displayName}</h3>
                  <p className="text-sm text-[var(--text3)] mb-8">{profile?.email}</p>
                </div>

                <div className="space-y-2">
                  <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors font-bold text-sm">
                    <div className="p-2 bg-[var(--surface)] border border-white/5 rounded-xl"><UserIcon size={18} /></div>
                    {t('nav.profile')}
                  </button>
                  <button onClick={() => { navigate('/settings'); setProfileOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors font-bold text-sm">
                    <div className="p-2 bg-[var(--surface)] border border-white/5 rounded-xl"><Settings size={18} /></div>
                    {t('nav.settings')}
                  </button>
                  <div className="h-px bg-white/5 my-4" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-colors font-bold text-sm">
                    <div className="p-2 bg-red-500/10 rounded-xl"><LogOut size={18} /></div>
                    {t('auth.logout')}
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    </div>
  );
};

export default AppLayout;
