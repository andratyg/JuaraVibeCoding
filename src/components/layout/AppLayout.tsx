import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Zap, CheckSquare, Dumbbell, BookOpen, 
  BarChart2, FileText, MessageCircle, Settings, MoreHorizontal, 
  Bell, Search, User as UserIcon, LogOut
} from 'lucide-react';
import { useApp } from '../../App';
import { auth } from '../../config/firebase';
import { toast } from 'react-hot-toast';

const AppLayout = () => {
  const { t } = useTranslation();
  const { profile } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const mainNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { path: '/checkin', icon: Zap, key: 'checkin' },
    { path: '/tasks', icon: CheckSquare, key: 'tasks' },
    { path: '/fitness', icon: Dumbbell, key: 'fitness' },
    { path: '/analytics', icon: BarChart2, key: 'analytics' },
  ];

  const toolsNavItems = [
    { path: '/journal', icon: BookOpen, key: 'journal' },
    { path: '/summarizer', icon: FileText, key: 'summarizer' },
    { path: '/coach', icon: MessageCircle, key: 'coach' },
    { path: '/settings', icon: Settings, key: 'settings' },
  ];

  const bottomTabs = mainNavItems.slice(0, 4);
  const allItems = [...mainNavItems, ...toolsNavItems];
  const pageTitle = allItems.find(i => location.pathname.startsWith(i.path)) 
    ? t(`nav.${allItems.find(i => location.pathname.startsWith(i.path))?.key}`) 
    : 'FlowState';

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success(t('auth.logoutSuccess') || 'Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* ── SIDEBAR DESKTOP (lg: 1024px+) ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] bg-[var(--bg)] border-r border-[var(--border)] z-40 overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border)] flex-shrink-0">
          <div className="w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center text-white text-base flex-shrink-0" style={{ background: 'var(--accent)' }}>⚡</div>
          <span className="font-bold text-[var(--text)] text-[15px] tracking-tight">FlowState</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-2" style={{ color: 'var(--text3)' }}>{t('sidebar.main') || 'Utama'}</p>
          {mainNavItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)]
                text-sm font-medium w-full transition-all duration-200
                ${isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}
              `}
              style={({ isActive }) => isActive ? { background: 'var(--accent-bg)' } : {}}>
              <item.icon size={16} />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}

          <p className="text-[10px] font-semibold tracking-widest uppercase px-3 mt-5 mb-2" style={{ color: 'var(--text3)' }}>{t('sidebar.tools') || 'Tools'}</p>
          {toolsNavItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)]
                text-sm font-medium w-full transition-all duration-200
                ${isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}
              `}
              style={({ isActive }) => isActive ? { background: 'var(--accent-bg)' } : {}}>
              <item.icon size={16} />
              {t(`nav.${item.key}`)}
            </NavLink>
          ))}
        </nav>

        <div onClick={() => setProfileOpen(true)}
          className="flex items-center gap-3 px-4 py-4 border-t border-[var(--border)] cursor-pointer hover:bg-[var(--surface)] transition-colors flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #9B8FFF)' }}>
            {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text)] text-xs font-medium truncate">{profile?.displayName}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{profile?.email}</p>
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR TABLET (md: 768px - lg: 1023px) ── */}
      <aside className="hidden md:flex lg:hidden flex-col fixed left-0 top-0 bottom-0 w-[52px] bg-[var(--bg)] border-r border-[var(--border)] z-40">
        <div className="flex items-center justify-center h-16 border-b border-[var(--border)] flex-shrink-0">
          <div className="w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center text-white text-base" style={{ background: 'var(--accent)' }}>⚡</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-1">
          {allItems.map(item => (
            <div key={item.path} className="relative group w-full flex justify-center">
              <NavLink to={item.path}
                className={({ isActive }) => `
                  w-9 h-9 flex items-center justify-center rounded-[var(--r-sm)]
                  transition-all duration-200 min-w-[44px] min-h-[44px]
                  ${isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface)]'}
                `}
                style={({ isActive }) => isActive ? { background: 'var(--accent-bg)' } : {}}>
                <item.icon size={18} />
              </NavLink>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2
                px-2.5 py-1.5 rounded-[var(--r-sm)] text-xs font-medium whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-150 z-50 border shadow-xl"
                style={{ background: 'var(--surface2)', color: 'var(--text)', borderColor: 'var(--border2)' }}>
                {t(`nav.${item.key}`)}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent" style={{ borderRightColor: 'var(--surface2)' }} />
              </div>
            </div>
          ))}
        </nav>

        <div className="flex justify-center py-3 border-t border-[var(--border)] flex-shrink-0">
          <button onClick={() => setProfileOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold min-w-[44px] min-h-[44px]"
            style={{ background: 'linear-gradient(135deg, var(--accent), #9B8FFF)' }}>
            {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="ml-0 md:ml-[52px] lg:ml-[220px] pb-[68px] md:pb-0 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-5 border-b border-[var(--border)] flex-shrink-0"
          style={{ background: 'rgba(13,15,20,0.92)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-2">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--r-xs)] flex items-center justify-center text-white text-xs" style={{ background: 'var(--accent)' }}>⚡</div>
              <span className="font-bold text-[var(--text)] text-sm">FlowState</span>
            </div>
            <h1 className="hidden lg:block text-[var(--text)] font-semibold text-base">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs rounded-[var(--r-sm)] transition-colors border"
              style={{ background: 'var(--surface)', color: 'var(--text3)', borderColor: 'var(--border)' }}>
              <Search size={13} /> {t('common.search')}
              <kbd className="text-[10px] px-1 py-0.5 rounded ml-2" style={{ background: 'var(--surface2)' }}>⌘K</kbd>
            </button>

            <button className="relative w-9 h-9 flex items-center justify-center rounded-[var(--r-sm)] hover:bg-[var(--surface)] transition-colors">
              <Bell size={17} style={{ color: 'var(--text3)' }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full border" style={{ background: 'var(--error)', borderColor: 'var(--bg)' }} />
            </button>

            <button onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent), #9B8FFF)' }}>
              {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 max-w-[1400px] mx-auto px-4 py-6 md:px-6 md:py-8 w-full">
          <Outlet />
        </div>
      </main>

      {/* ── BOTTOM TAB BAR MOBILE ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--border)]"
        style={{ background: 'rgba(13,15,20,0.96)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)', paddingTop: '6px' }}>
        {bottomTabs.map(tab => (
          <NavLink key={tab.path} to={tab.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-0.5 px-3 py-2 rounded-[var(--r-md)] transition-all min-w-[56px] min-h-[44px] justify-center
              ${isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text3)]'}
            `}>
            <tab.icon size={22} />
            <span className="text-[10px] font-medium">{t(`nav.${tab.key}`)}</span>
          </NavLink>
        ))}
        <button onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-[var(--r-md)] min-w-[56px] min-h-[44px] justify-center transition-colors"
          style={{ color: 'var(--text3)' }}>
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-medium">{t('nav.more')}</span>
        </button>
      </nav>

      {/* ── SLIDE-UP DRAWER MOBILE ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div className="md:hidden fixed inset-0 z-[55]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
            <motion.div className="absolute bottom-0 left-0 right-0 rounded-t-[var(--r-2xl)] border-t border-[var(--border)] overflow-hidden"
              style={{ background: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border2)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-6">
                {toolsNavItems.map(item => (
                  <NavLink key={item.path} to={item.path} onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-2.5 p-3.5 rounded-[var(--r-lg)] text-sm font-medium transition-colors border"
                    style={{ background: 'var(--surface2)', color: 'var(--text2)', borderColor: 'var(--border)' }}>
                    <item.icon size={17} style={{ color: 'var(--accent-text)', flexShrink: 0 }} />
                    {t(`nav.${item.key}`)}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setProfileOpen(false)} 
            />
            <motion.div className="relative w-full max-w-sm bg-[var(--surface)] rounded-[var(--r-2xl)] border border-[var(--border)] p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-xl"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #9B8FFF)' }}>
                  {profile?.displayName?.charAt(0)?.toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-[var(--text)]">{profile?.displayName}</h3>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>{profile?.email}</p>
              </div>
              <div className="space-y-1">
                <NavLink to="/profile" onClick={() => setProfileOpen(false)} 
                  className="flex items-center gap-3 p-3 rounded-[var(--r-md)] hover:bg-[var(--surface2)] text-sm transition-colors text-[var(--text2)]">
                  <UserIcon size={16} /> {t('nav.profile')}
                </NavLink>
                <NavLink to="/settings" onClick={() => setProfileOpen(false)} 
                  className="flex items-center gap-3 p-3 rounded-[var(--r-md)] hover:bg-[var(--surface2)] text-sm transition-colors text-[var(--text2)]">
                  <Settings size={16} /> {t('nav.settings')}
                </NavLink>
                <div className="h-px bg-[var(--border)] my-4" />
                <button onClick={handleLogout} 
                  className="flex items-center gap-3 p-3 rounded-[var(--r-md)] hover:bg-[var(--error-bg)] text-[var(--error)] text-sm w-full transition-colors">
                  <LogOut size={16} /> {t('nav.logout')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppLayout;
