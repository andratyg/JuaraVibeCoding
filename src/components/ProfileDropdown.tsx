import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Mail, Settings, Globe, Shield, Lock, Trash2, LogOut, 
  ChevronDown, ChevronRight, CheckCircle, Moon, Sun, Monitor, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth, db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function ProfileDropdown() {
  const { t, i18n } = useTranslation();
  const { profile, user, theme, setTheme } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await user.delete();
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-10 h-10 rounded-full border-2 overflow-hidden bg-slate-50 flex items-center justify-center transition-all",
          isOpen ? "border-[var(--primary)] ring-4 ring-[var(--primary)]/10" : "border-slate-200 hover:border-[var(--primary)]"
        )}
      >
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-slate-400">
            {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 10 }}
            exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
            className="absolute bottom-0 left-full ml-4 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 py-2"
          >
            {/* Header / User Info */}
            <div className="p-4 border-b border-slate-50 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 truncate">{profile?.displayName || 'User'}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{user?.email}</p>
              </div>
            </div>

            {/* Main Actions */}
            <div className="p-2 space-y-1">
              <Link 
                to="/profile"
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all group"
                onClick={() => setIsOpen(false)}
              >
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User size={18} />
                </div>
                {t('profile.accountDetails')}
              </Link>
              
              <Link 
                to="/settings"
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all group"
                onClick={() => setIsOpen(false)}
              >
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings size={18} />
                </div>
                {t('profile.settings')}
              </Link>
            </div>

            {/* Footer */}
            <div className="p-2 mt-2 bg-slate-50/50">
              <button
                onClick={() => auth.signOut()}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all group"
              >
                <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogOut size={18} />
                </div>
                {t('sidebar.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-rose-100"
            >
              <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">
                {t('profile.dataManagement.delete')}?
              </h3>
              <p className="text-slate-500 text-sm font-medium text-center mb-8">
                {t('profile.dataManagement.deleteWarning')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {t('profile.dataManagement.delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
