import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Settings, Shield, LogOut, 
  ChevronRight, Moon, Sun, Monitor, Zap, Activity, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function ProfileDropdown() {
  const { t, i18n } = useTranslation();
  const { profile, user, theme, setTheme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-[1.25rem] border-4 overflow-hidden bg-slate-50 flex items-center justify-center transition-all relative group",
          isOpen ? "border-slate-900 ring-8 ring-slate-900/5" : "border-white shadow-xl shadow-slate-200/50 hover:border-slate-100"
        )}
      >
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-black text-slate-400">
            {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 10 }}
            exit={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
            className="absolute bottom-0 left-full ml-6 w-80 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white overflow-hidden z-50 p-6"
          >
            {/* User Core Bio */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 overflow-hidden shrink-0 border-4 border-white shadow-lg">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <User size={28} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-lg leading-tight truncate">{profile?.fullName || profile?.displayName || 'User'}</p>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">System Synchronized</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Energy</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{profile?.energyScore || 0}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Streak</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{profile?.streak || 0}</p>
                </div>
            </div>

            {/* Nav List */}
            <div className="space-y-1 mb-8">
              <DropdownLink 
                onClick={() => handleNav('/profile')}
                icon={<User size={18} />} 
                label={t('profile.tabs.account')}
                color="blue"
              />
              <DropdownLink 
                onClick={() => handleNav('/profile')} // Will navigate to profile then user can switch tab
                icon={<Shield size={18} />} 
                label={t('profile.tabs.security')}
                color="indigo"
              />
              <DropdownLink 
                onClick={() => handleNav('/profile')}
                icon={<Zap size={18} />} 
                label={t('profile.tabs.preferences')}
                color="amber"
              />
            </div>

            {/* Language Selection Quick Access */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] mb-6">
                <div className="flex items-center gap-3">
                    <Globe size={16} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{i18n.language === 'en' ? 'English' : 'Indonesian'}</span>
                </div>
                <button 
                    onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                    Switch
                </button>
            </div>

            {/* Footer Logout */}
            <button
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">{t('sidebar.logout')}</span>
                </div>
                <ChevronRight size={14} className="opacity-40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownLink({ label, icon, onClick, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        indigo: "bg-indigo-50 text-indigo-600",
        amber: "bg-amber-50 text-amber-600"
    };

    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", colors[color] || "bg-slate-50")}>
                    {icon}
                </div>
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{label}</span>
            </div>
            <ChevronRight size={14} className="text-slate-200 group-hover:translate-x-1 transition-all" />
        </button>
    );
}
