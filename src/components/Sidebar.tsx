import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, CheckSquare, Dumbbell, BookOpen, FileText, BarChart3, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useApp } from '../App';
import { cn } from '../lib/utils';
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
    <aside className="flex h-full w-20 flex-col items-center border-r border-slate-200 bg-white py-8 justify-between transition-all">
      <div className="flex flex-col items-center gap-8">
        <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[var(--primary-light)]">
          F
        </div>

        <nav className="flex flex-col gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={t(item.labelKey)}
              className={({ isActive }) =>
                cn(
                  'p-3 rounded-xl transition-all duration-300',
                  isActive
                    ? 'bg-[var(--primary-light)] text-[var(--primary)] shadow-sm shadow-[var(--primary)]/5'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <item.icon className="h-6 w-6" />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-6">
        <ProfileDropdown />
        <button
          onClick={() => auth.signOut()}
          className="p-3 text-slate-300 hover:text-red-500 transition-colors"
          title={t('sidebar.logout')}
        >
          <LogOut className="h-6 w-6" />
        </button>
      </div>
    </aside>
  );
}
