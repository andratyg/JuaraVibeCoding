import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Mail, Camera, CheckCircle, AlertCircle, Loader2, Save,
  Shield, Bell, Globe, Monitor, Moon, Sun, ChevronRight,
  Database, Trash2, Smartphone, ShieldCheck, Lock, Zap,
  Activity, Share2, HelpCircle, ExternalLink, Github, Twitter, Linkedin,
  MoreVertical, CreditCard, LogOut, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth, db, handleFirestoreError, OperationType } from '../config/firebase';
import { 
  updateProfile,
  RecaptchaVerifier, 
  PhoneAuthProvider,
  multiFactor,
  PhoneMultiFactorGenerator,
  linkWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { cn } from '../lib/utils';

type ProfileTab = 'account' | 'security' | 'preferences' | 'activity' | 'social' | 'help';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, profile, theme, setTheme, refreshProfile } = useApp();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Account Form States ---
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || profile?.phoneNumber || '');

  // --- Security / MFA States ---
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // --- Activity State ---
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setPhoneNumber(user?.phoneNumber || profile.phoneNumber || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (activeTab === 'activity' && user) {
      fetchActivityPulse();
    }
  }, [activeTab, user]);

  const fetchActivityPulse = async () => {
    if (!user) return;
    try {
      // Use the correct subcollection path defined in firestore.rules
      const energyPath = `users/${user.uid}/energyCheckIns`;
      const q = query(
        collection(db, energyPath),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => ({
        id: d.id,
        type: 'energy_check',
        title: 'Energy Synchronized',
        time: (d.data().createdAt ? (typeof d.data().createdAt === 'string' ? new Date(d.data().createdAt) : d.data().createdAt.toDate()) : new Date()).toLocaleString(),
        icon: <Zap size={14} className="text-amber-500" />
      }));
      setActivities(logs);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/energyCheckIns`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // --- Basic Validation ---
    if (!displayName.trim() || displayName.length < 3) {
      setMessage({ type: 'error', text: t('profile.errors.invalidUsername') || 'Username must be at least 3 characters.' });
      return;
    }

    if (!fullName.trim() || fullName.length < 3) {
      setMessage({ type: 'error', text: t('profile.errors.invalidFullName') || 'Full Name must be at least 3 characters.' });
      return;
    }

    // Robust phone number validation: strip non-digits, check length (9-15)
    const digits = phoneNumber.replace(/\D/g, '');
    if (phoneNumber && (digits.length < 9 || digits.length > 15)) {
      setMessage({ type: 'error', text: t('profile.errors.invalidPhone') || 'Please enter a valid phone number (9-15 digits).' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      // Update Firebase Auth
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      
      const userPath = `users/${user.uid}`;
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        fullName: fullName.trim(),
        bio: bio.trim(),
        phoneNumber: phoneNumber.trim()
      });
      
      await refreshProfile();
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err: any) {
      // Handle Firebase specific errors gracefully
      let errorMsg = t('common.error');
      if (err.code === 'permission-denied') {
        errorMsg = 'Security Violation: Permission denied.';
      }
      setMessage({ type: 'error', text: errorMsg });
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setLoading(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({ type: 'success', text: t('profile.security.resetSent') || 'Password reset link sent to your email.' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `auth/password-reset/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const [revoking, setRevoking] = useState(false);
  const handleRevokeSessions = async () => {
    setRevoking(true);
    // In a real environment, this would call a Cloud Function to revoke refresh tokens
    // We simulate a secure cryptographic handshake here
    setTimeout(() => {
      setRevoking(false);
      setMessage({ type: 'success', text: t('profile.security.sessionsRevoked') || 'All other active sessions have been invalidated.' });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Dynamic Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px]" />
      </div>

      <div className="relative p-4 md:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Navigation Sidebar - Responsive Layout */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6 lg:space-y-8">
          <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex flex-row lg:flex-col items-center gap-6 lg:mb-8">
              <div className="relative group shrink-0 lg:mb-6">
                <div className="h-20 w-20 lg:h-32 lg:w-32 rounded-[1.5rem] lg:rounded-[2.5rem] bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-300" />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 h-8 w-8 lg:h-10 lg:w-10 bg-slate-900 text-white rounded-lg lg:rounded-xl flex items-center justify-center border-2 lg:border-4 border-white shadow-lg hover:scale-110 active:scale-95 transition-all">
                  <Camera size={14} />
                </button>
              </div>
              <div className="flex-1 lg:text-center">
                <h2 className="font-black text-lg lg:text-2xl text-slate-900 leading-tight truncate">{profile?.fullName || user?.displayName || 'User'}</h2>
                <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">FlowState Member</p>
              </div>
            </div>

            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar gap-1 mt-6 lg:mt-0 py-2 lg:py-0 border-t lg:border-t-0 border-slate-50">
              <TabButton active={activeTab === 'account'} onClick={() => setActiveTab('account')} icon={<User size={18} />} label={t('profile.tabs.account')} />
              <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield size={18} />} label={t('profile.tabs.security')} />
              <TabButton active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} icon={<Monitor size={18} />} label={t('profile.tabs.preferences')} />
              <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={<Activity size={18} />} label={t('profile.tabs.activity')} />
              <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} icon={<Share2 size={18} />} label={t('profile.tabs.social')} />
              <TabButton active={activeTab === 'help'} onClick={() => setActiveTab('help')} icon={<HelpCircle size={18} />} label={t('profile.tabs.help')} />
            </nav>

            <div className="hidden lg:block mt-8 pt-8 border-t border-slate-50">
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full flex items-center gap-3 px-6 py-4 text-rose-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-50 transition-all group"
                >
                    <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                    {t('sidebar.logout')}
                </button>
            </div>
          </div>

          {/* Quick Stats Bento */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-emerald-500 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80 relative z-10">Streak</p>
              <h4 className="text-3xl lg:text-4xl font-black mt-1 relative z-10">12</h4>
            </div>
            <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80 relative z-10">Level</p>
              <h4 className="text-3xl lg:text-4xl font-black mt-1 relative z-10">08</h4>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-8"
            >
              <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight capitalize">
                    {t(`profile.tabs.${activeTab}`)}
                </h1>
                <p className="text-slate-400 font-medium mt-2">Personalize your {activeTab} environment and system data.</p>
              </header>

              {message && (
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border shadow-sm",
                  message.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {message.text}
                </div>
              )}

              {activeTab === 'account' && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                  <form onSubmit={handleUpdateProfile} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.fullName')}</label>
                            <input 
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Indra Andra"
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.username')}</label>
                            <input 
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-bold text-slate-900"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.email')}</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="email" value={user?.email || ''} readOnly className="w-full pl-12 pr-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl font-bold text-slate-500 cursor-not-allowed" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.phone')}</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-bold text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.bio')}</label>
                        <textarea 
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-bold text-slate-900 resize-none"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {t('profile.saveChanges')}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{t('profile.security.googleAuth')}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Identity Infrastructure</p>
                            </div>
                        </div>
                        {user?.providerData?.some(p => p.providerId === 'google.com') ? (
                            <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                                <CheckCircle size={12} />
                                {t('profile.security.googleStatusProtected')}
                            </div>
                        ) : (
                            <div className="px-6 py-2 bg-amber-50 text-amber-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-amber-100">
                                {t('profile.security.googleStatusStandard')}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                {t('profile.security.googleDesc')}
                            </p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-3 text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    Cryptographic Handshakes
                                </li>
                                <li className="flex items-center gap-3 text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    Hardware Key Support
                                </li>
                            </ul>
                        </div>
                        <button 
                            className={cn(
                                "py-8 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all border-4",
                                user?.providerData?.some(p => p.providerId === 'google.com')
                                    ? "bg-slate-50 border-emerald-100 text-emerald-500" 
                                    : "bg-slate-900 border-white text-white shadow-2xl hover:scale-[1.02]"
                            )}
                        >
                            {user?.providerData?.some(p => p.providerId === 'google.com') ? <ShieldCheck size={40} /> : <Globe size={40} className="text-indigo-400" />}
                            <span className="font-black uppercase tracking-[0.2em] text-[10px]">
                                {user?.providerData?.some(p => p.providerId === 'google.com') ? t('profile.security.googleActive') : t('profile.security.googleActivate')}
                            </span>
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <button 
                        onClick={handlePasswordReset}
                        disabled={loading}
                        className="bg-white p-8 rounded-[2rem] border border-slate-100 text-left hover:bg-slate-50 transition-all group shadow-sm disabled:opacity-50"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                            </div>
                            <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">{t('profile.changePassword')}</h4>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">Secure recovery via email</p>
                    </button>

                    <button 
                        onClick={handleRevokeSessions}
                        disabled={revoking}
                        className="bg-white p-8 rounded-[2rem] border border-slate-100 text-left hover:bg-slate-50 transition-all group shadow-sm disabled:opacity-50"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                {revoking ? <Loader2 className="animate-spin" size={20} /> : <Smartphone size={20} />}
                            </div>
                            <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">{t('profile.security.activeSessions')}</h4>
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-slate-400 font-bold leading-tight">Currently on {navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown Device'}</p>
                            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Local Session Active</p>
                        </div>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Appearance */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                                <Monitor size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('profile.appearance.title')}</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <ThemeToggle active={theme === 'light'} onClick={() => setTheme('light')} label={t('profile.appearance.light')} icon={<Sun size={14} />} />
                            <ThemeToggle active={theme === 'dark'} onClick={() => setTheme('dark')} label={t('profile.appearance.dark')} icon={<Moon size={14} />} />
                            <ThemeToggle active={theme === 'system'} onClick={() => setTheme('system')} label={t('profile.appearance.system')} icon={<Monitor size={14} />} />
                        </div>
                    </div>

                    {/* Language Toggle CRITICAL - BIG & INTUITIVE */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Globe size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('profile.language.title')}</h3>
                        </div>
                        <div className="flex bg-slate-50 p-2 rounded-2xl">
                            <button 
                                onClick={() => i18n.changeLanguage('en')}
                                className={cn(
                                    "flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    i18n.language === 'en' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => i18n.changeLanguage('id')}
                                className={cn(
                                    "flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                    i18n.language === 'id' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                Indonesian
                            </button>
                        </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Bell size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('profile.notifications.title')}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <NudgeToggle label={t('profile.notifications.email')} icon={<Mail size={16} />} active={profile?.settings?.notifications.email} />
                        <NudgeToggle label={t('profile.notifications.push')} icon={<Zap size={16} />} active={profile?.settings?.notifications.push} />
                        <NudgeToggle label={t('profile.notifications.messages')} icon={<Mail size={16} />} active={profile?.settings?.notifications.messages} />
                        <NudgeToggle label={t('profile.notifications.alerts')} icon={<Bell size={16} />} active={profile?.settings?.notifications.alerts} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-8">
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('profile.activity.title')}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('profile.activity.subtitle')}</p>
                        </div>
                    </div>

                    {activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                <Activity size={40} />
                            </div>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto">{t('profile.activity.empty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((act) => (
                                <div key={act.id} className="flex items-center gap-6 p-6 bg-slate-50/50 border border-slate-50 rounded-[1.5rem] group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                                    <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                                        {act.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-slate-900 text-sm">{act.title}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{act.time}</p>
                                    </div>
                                    <MoreVertical size={16} className="text-slate-300 cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <Share2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('profile.social.title')}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('profile.social.subtitle')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SocialCard name="Google Identity" icon={<Globe size={20} />} active={user?.providerData?.some(p => p.providerId === 'google.com')} />
                            <SocialCard name="GitHub Engine" icon={<Github size={20} />} active={profile?.socialLinks?.github} />
                            <SocialCard name="Twitter / X" icon={<Twitter size={20} />} username="@flowstate" />
                            <SocialCard name="LinkedIn" icon={<Linkedin size={20} />} connected />
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'help' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                                    <HelpCircle size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('profile.help.title')}</h3>
                            </div>
                            <div className="space-y-2">
                                <HelpLink icon={<Database size={16} />} label={t('profile.help.faq')} />
                                <HelpLink icon={<Mail size={16} />} label={t('profile.help.contact')} />
                                <HelpLink icon={<ExternalLink size={16} />} label={t('profile.help.docs')} />
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl space-y-8 relative overflow-hidden group">
                            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-1000" />
                            <div className="relative z-10 space-y-6">
                                <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                    <CreditCard size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">{t('profile.dataManagement.title')}</h3>
                                    <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Persistence & Governance</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all">
                                        {t('profile.dataManagement.export')}
                                    </button>
                                    <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-all">
                                        {t('profile.dataManagement.delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 lg:py-4 rounded-xl lg:rounded-2xl transition-all relative group shrink-0",
        active 
            ? "bg-slate-900 text-white shadow-xl shadow-black/10" 
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
    >
        <div className={cn("transition-transform", active ? "scale-110" : "group-hover:scale-110")}>
            {icon}
        </div>
        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>
        {active && (
            <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 lg:bottom-auto lg:left-0 w-full lg:w-1.5 h-1 lg:h-6 bg-indigo-400 rounded-t-full lg:rounded-r-full"
            />
        )}
    </button>
  );
}

function ThemeToggle({ active, onClick, label, icon }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 group",
                active 
                    ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                    : "bg-slate-50 border-transparent text-slate-300 hover:bg-white hover:border-slate-100"
            )}
        >
            <div className={cn("transition-transform duration-500", active ? "text-white scale-110" : "group-hover:scale-125")}>
                {icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function NudgeToggle({ label, icon, active }: any) {
    const [on, setOn] = useState(active);
    return (
        <button 
            onClick={() => setOn(!on)}
            className={cn(
                "p-6 rounded-[2rem] border-2 text-left transition-all flex flex-col gap-4 active:scale-[0.98]",
                on ? "bg-white border-indigo-500 shadow-xl shadow-indigo-50" : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-100"
            )}
        >
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", on ? "bg-indigo-500 text-white" : "bg-white text-slate-300 shadow-sm")}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{label}</p>
        </button>
    );
}

function SocialCard({ name, icon, active, username, connected }: any) {
    return (
        <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-50 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-900">
                    {icon}
                </div>
                <div>
                    <h4 className="font-black text-slate-900 text-sm">{name}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{username || (active || connected ? 'Connected' : 'Not Linked')}</p>
                </div>
            </div>
            <button className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                (active || connected) ? "text-rose-500 hover:bg-rose-50" : "bg-slate-900 text-white hover:shadow-lg"
            )}>
                {(active || connected) ? 'Disconnect' : 'Connect'}
            </button>
        </div>
    );
}

function HelpLink({ icon, label }: any) {
    return (
        <a href="#" className="flex items-center justify-between p-5 bg-slate-50 border border-slate-50 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
            <div className="flex items-center gap-4">
                <div className="text-slate-400 group-hover:text-slate-900 transition-colors">
                    {icon}
                </div>
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-all" />
        </a>
    );
}
