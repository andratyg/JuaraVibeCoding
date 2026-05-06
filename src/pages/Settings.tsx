import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Shield, Eye, Globe, Monitor, Moon, Sun, 
  ChevronRight, Database, Trash2, AlertCircle, Loader2,
  Phone, CheckCircle, Smartphone, ShieldCheck, Mail, MessageSquare, 
  Settings as SettingsIcon, Lock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth, db } from '../lib/firebase';
import { 
  doc, deleteDoc, updateDoc
} from 'firebase/firestore';
import { 
  RecaptchaVerifier, 
  PhoneAuthProvider,
  multiFactor,
  PhoneMultiFactorGenerator,
  linkWithCredential,
  sendPasswordResetEmail
} from 'firebase/auth';
import { cn } from '../lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, profile, theme, setTheme, refreshProfile } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Security / A2F States
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const otpInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showOtpModal && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOtpModal]);

  // Local settings state
  const [notifications, setNotifications] = useState(profile?.settings?.notifications || {
    email: true,
    push: true,
    messages: false,
    alerts: true
  });
  const [privacy, setPrivacy] = useState(profile?.settings?.privacy || {
    visibility: 'public',
    dataSharing: true
  });
  const [aiPrefs, setAiPrefs] = useState(profile?.settings?.aiPreferences || {
    coachTone: 'balanced',
    nudgeFrequency: 'normal',
    focusAreas: ['Fitness', 'Mental Health']
  });
  const [accessibility, setAccessibility] = useState(profile?.settings?.accessibility || {
    highContrast: false,
    fontScale: 1,
    reducedMotion: false
  });

  useEffect(() => {
    if (profile?.settings?.notifications) setNotifications(profile.settings.notifications);
    if (profile?.settings?.privacy) setPrivacy(profile.settings.privacy);
    if (profile?.settings?.aiPreferences) setAiPrefs(profile.settings.aiPreferences);
    if (profile?.settings?.accessibility) setAccessibility(profile.settings.accessibility);
  }, [profile]);

  const updateSettings = async (updates: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        settings: {
          notifications: updates.notifications || notifications,
          privacy: updates.privacy || privacy,
          aiPreferences: updates.aiPreferences || aiPrefs,
          accessibility: updates.accessibility || accessibility,
          theme: updates.theme || theme
        }
      });
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);
    updateSettings({ notifications: newNotifications });
  };

  const handleTogglePrivacy = (key: keyof typeof privacy) => {
    const newPrivacy = { ...privacy, [key]: !privacy[key] };
    setPrivacy(newPrivacy);
    updateSettings({ privacy: newPrivacy });
  };

  const handleToggleAccessibility = (key: keyof typeof accessibility) => {
    const newAccessibility = { ...accessibility, [key]: !accessibility[key] };
    setAccessibility(newAccessibility);
    updateSettings({ accessibility: newAccessibility });
  };

  const handleAiPrefChange = (key: keyof typeof aiPrefs, value: any) => {
    const newAiPrefs = { ...aiPrefs, [key]: value };
    setAiPrefs(newAiPrefs);
    updateSettings({ aiPreferences: newAiPrefs });
  };

  const handleVisibilityChange = (visibility: any) => {
    const newPrivacy = { ...privacy, visibility };
    setPrivacy(newPrivacy);
    updateSettings({ privacy: newPrivacy });
  };

  const setupRecaptcha = (containerId: string) => {
    if ((window as any).recaptchaVerifier) return (window as any).recaptchaVerifier;
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => console.log("Recaptcha resolved")
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleStartPhoneVerification = async () => {
    if (!user || !phone) return;
    setLoading(true);
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const provider = new PhoneAuthProvider(auth);
      const vid = await provider.verifyPhoneNumber(phone, verifier);
      setVerificationId(vid);
      setShowOtpModal(true);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengirim SMS. Periksa format nomor (+62...).' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!verificationId || !verificationCode || !user) return;
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      if (mfaEnrolling) {
        const phoneAuthAssertion = PhoneMultiFactorGenerator.assertion(credential);
        await multiFactor(user).enroll(phoneAuthAssertion, 'My SMS MFA');
        setMessage({ type: 'success', text: 'A2F Berhasil Diaktifkan!' });
      } else {
        await linkWithCredential(user, credential);
        setMessage({ type: 'success', text: 'Nomor telepon terverifikasi!' });
      }
      setShowOtpModal(false);
      setMfaEnrolling(false);
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Kode salah atau expired.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({ type: 'success', text: 'Email reset password telah dikirim ke ' + user.email });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengirim email reset: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Collect all data
      const collections = ['tasks', 'wellness_logs', 'energy_logs'];
      const exportData: any = { profile };
      
      for (const col of collections) {
        const q = query(collection(db, col), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        exportData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `pulse_data_export_${new Date().toISOString()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setMessage({ type: 'success', text: 'Data berhasil diekspor!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengekspor data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !window.confirm(t('profile.dataManagement.deleteWarning'))) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await user.delete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isMfaActive = multiFactor(user as any).enrolledFactors.length > 0;
  const isPhoneUnverified = phone && !user?.phoneNumber;

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
              <SettingsIcon size={18} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">System Configuration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t('profile.settings')}</h1>
          <p className="text-slate-500 font-medium mt-1">Configure your digital environment and security protocols.</p>
        </div>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl flex items-center gap-3 font-bold text-sm shadow-sm",
            message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
          )}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Security Hub - Full Width */}
        <SectionContainer title={t('profile.security.title')} subtitle="Identity & Access" icon={<ShieldCheck size={24} />} className="md:col-span-12 border-indigo-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.phone')}</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812..."
                      className={cn(
                        "w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all font-bold",
                        isPhoneUnverified ? "border-amber-200" : "border-slate-50"
                      )}
                    />
                  </div>
                  {!user?.phoneNumber && (
                    <button 
                      type="button"
                      onClick={() => { setMfaEnrolling(false); handleStartPhoneVerification(); }}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      {t('common.verify')}
                    </button>
                  )}
                </div>
                {isPhoneUnverified && (
                  <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse">
                    <AlertCircle size={12} />
                    Pending Verification Required
                  </div>
                )}
                {user?.phoneNumber && (
                  <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <CheckCircle size={12} />
                    Identity Secure: {user.phoneNumber}
                  </div>
                )}
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                  <Lock size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{t('profile.changePassword')}</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-tight">Update your authentication credentials.</p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </div>

            <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 flex flex-col justify-between relative overflow-hidden group">
              <Zap className="absolute -right-4 -top-4 text-indigo-100 h-24 w-24 rotate-12 group-hover:scale-125 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-slate-900 text-lg">{t('profile.security.twoFactor')}</h4>
                  {isMfaActive ? (
                    <span className="bg-emerald-500 text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] shadow-sm">{t('profile.security.mfaStatusProtected')}</span>
                  ) : (
                    <span className="bg-white text-slate-400 text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] border border-slate-200">{t('profile.security.mfaStatusStandard')}</span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-xs">
                  {t('profile.security.mfaDesc')}
                </p>
              </div>
              
              <button
                onClick={() => {
                  if (!user?.phoneNumber) {
                    setMessage({ type: 'error', text: 'Verifikasi nomor telepon dulu sebelum mengaktifkan A2F.' });
                  } else {
                    setMfaEnrolling(true);
                    handleStartPhoneVerification();
                  }
                }}
                disabled={isMfaActive || (loading && mfaEnrolling)}
                className={cn(
                  "mt-6 w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 relative overflow-hidden",
                  isMfaActive 
                    ? "bg-white text-emerald-500 border-2 border-emerald-100 cursor-default" 
                    : "bg-slate-900 text-white hover:bg-black active:scale-[0.98] shadow-2xl shadow-slate-200"
                )}
              >
                {isMfaActive ? <ShieldCheck size={16} /> : (loading && mfaEnrolling ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-indigo-400" />)}
                {isMfaActive ? t('profile.security.mfaActive') : t('profile.security.mfaActivate')}
              </button>
            </div>
          </div>
          <div id="recaptcha-container" className="hidden"></div>
        </SectionContainer>

        {/* Appearance */}
        <SectionContainer title={t('profile.appearance.title')} subtitle="UI/UX Styles" icon={<Eye size={24} />} className="md:col-span-6 border-sky-100">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.appearance.theme')}</label>
            <div className="grid grid-cols-3 gap-3">
              <ThemeButton label="Light" active={theme === 'light'} onClick={() => setTheme('light')} icon={<Sun size={14} />} />
              <ThemeButton label="Dark" active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<Moon size={14} />} />
              <ThemeButton label="Auto" active={theme === 'system'} onClick={() => setTheme('system')} icon={<Monitor size={14} />} />
            </div>
          </div>
        </SectionContainer>

        {/* Language */}
        <SectionContainer title={t('profile.language.title')} subtitle="Locales" icon={<Globe size={24} />} className="md:col-span-6 border-emerald-100">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.language.select')}</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-black focus:bg-white focus:border-emerald-500 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="en">English (Global)</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
          </div>
        </SectionContainer>

        {/* AI Configuration */}
        <SectionContainer 
          title={t('profile.ai.title')} 
          subtitle={t('profile.ai.subtitle')} 
          icon={<Zap size={24} className="text-amber-500" />} 
          className="md:col-span-12 lg:col-span-7 border-amber-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.ai.persona')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'balanced', label: t('profile.ai.tones.balanced'), color: 'bg-slate-100' },
                  { id: 'tough', label: t('profile.ai.tones.tough'), color: 'bg-rose-50' },
                  { id: 'supportive', label: t('profile.ai.tones.supportive'), color: 'bg-emerald-50' },
                  { id: 'stoic', label: t('profile.ai.tones.stoic'), color: 'bg-indigo-50' }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleAiPrefChange('coachTone', tone.id)}
                    className={cn(
                      "p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-center",
                      aiPrefs.coachTone === tone.id ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.ai.frequency')}</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                {['low', 'normal', 'high'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleAiPrefChange('nudgeFrequency', freq)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      aiPrefs.nudgeFrequency === freq ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {freq}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-bold text-slate-400 leading-tight">{t('profile.ai.frequencyDesc')}</p>
            </div>
          </div>
        </SectionContainer>

        {/* Accessibility */}
        <SectionContainer 
          title={t('profile.accessibility.title')} 
          subtitle={t('profile.accessibility.subtitle')} 
          icon={<Monitor size={24} className="text-sky-500" />} 
          className="md:col-span-12 lg:col-span-5 border-sky-100"
        >
          <div className="space-y-6">
            <Toggle isOn={accessibility.highContrast} onToggle={() => handleToggleAccessibility('highContrast')} label={t('profile.accessibility.highContrast')} />
            <Toggle isOn={accessibility.reducedMotion} onToggle={() => handleToggleAccessibility('reducedMotion')} label={t('profile.accessibility.reducedMotion')} />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.accessibility.fontScale')}</label>
                <span className="text-xs font-black text-slate-900">{Math.round(accessibility.fontScale * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.8" 
                max="1.5" 
                step="0.1" 
                value={accessibility.fontScale}
                onChange={(e) => handleAiPrefChange('accessibility', { ...accessibility, fontScale: parseFloat(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>
          </div>
        </SectionContainer>

        {/* Notifications */}
        <SectionContainer title={t('profile.notifications.title')} subtitle="Push & Email" icon={<Bell size={24} />} className="md:col-span-12 lg:col-span-7 border-indigo-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ToggleCard 
              label={t('profile.notifications.email')} 
              desc="Receive weekly analytical reports." 
              icon={<Mail size={16} />} 
              isOn={notifications.email} 
              onToggle={() => handleToggleNotification('email')} 
            />
            <ToggleCard 
              label={t('profile.notifications.push')} 
              desc="Real-time wellness nudges." 
              icon={<Zap size={16} />} 
              isOn={notifications.push} 
              onToggle={() => handleToggleNotification('push')} 
            />
            <ToggleCard 
              label={t('profile.notifications.messages')} 
              desc="Coach feedback & mentorship." 
              icon={<MessageSquare size={16} />} 
              isOn={notifications.messages} 
              onToggle={() => handleToggleNotification('messages')} 
            />
            <ToggleCard 
              label={t('profile.notifications.alerts')} 
              desc="Daily streak & goal reminders." 
              icon={<Bell size={16} />} 
              isOn={notifications.alerts} 
              onToggle={() => handleToggleNotification('alerts')} 
            />
          </div>
        </SectionContainer>

        {/* Privacy */}
        <SectionContainer title={t('profile.privacy.title')} subtitle="Visibility Control" icon={<Shield size={24} />} className="md:col-span-12 lg:col-span-5 border-amber-100">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('profile.privacy.visibility')}</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                {(['public', 'friends', 'private'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVisibilityChange(v)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      privacy.visibility === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {t(`profile.privacy.${v}`)}
                  </button>
                ))}
              </div>
            </div>
            <Toggle isOn={privacy.dataSharing} onToggle={() => handleTogglePrivacy('dataSharing')} label={t('profile.privacy.dataSharing')} />
            <p className="text-[9px] font-bold text-slate-400 leading-tight">{t('profile.privacy.dataSharingDesc')}</p>
          </div>
        </SectionContainer>

        {/* Data Management */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:col-span-12 bg-white p-10 rounded-[2.5rem] border border-rose-100 shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center shrink-0">
                <Database size={32} />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-slate-900">{t('profile.dataManagement.title')}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Account Persistence Control</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleExportData}
                disabled={loading}
                className="flex-1 md:flex-none py-5 px-10 border-2 border-slate-100 bg-white rounded-2xl text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading && !mfaEnrolling ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                {t('profile.dataManagement.export')}
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 md:flex-none py-5 px-10 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
              >
                {loading && !mfaEnrolling ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                {t('profile.dataManagement.delete')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-indigo-100"
            >
              <div className="h-20 w-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                <Smartphone size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-3">
                {mfaEnrolling ? 'Aktifkan A2F' : 'Verifikasi Nomor'}
              </h3>
              <div className="bg-amber-50 rounded-2xl p-4 mb-6 border border-amber-100">
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed text-center">
                  Kami telah mengirimkan 6 digit kode ke <span className="text-slate-900">{phone}</span>. Masukkan kode tersebut untuk melanjutkan.
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center mb-4">6-Digit Verification Code</label>
                  <input
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.3em] text-3xl font-black p-6 bg-slate-50 border-4 border-slate-50 rounded-[2rem] focus:border-indigo-600 focus:bg-white focus:outline-none transition-all mb-2 shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirmOtp}
                    disabled={loading || verificationCode.length < 6}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {mfaEnrolling ? 'Konfirmasi & Aktifkan' : 'Verifikasi Nomor'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOtpModal(false);
                      setMfaEnrolling(false);
                      setVerificationCode('');
                    }}
                    className="w-full py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 transition-all"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionContainer({ title, subtitle, icon, children, className }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col space-y-8", className)}
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-slate-50 border border-slate-100 text-slate-900 rounded-3xl flex items-center justify-center shrink-0 shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </motion.div>
  );
}

function ThemeButton({ label, active, onClick, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all group active:scale-95",
        active 
          ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
          : "bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200"
      )}
    >
      <div className={cn("transition-transform group-hover:scale-125 duration-500", active ? "text-white" : "text-slate-300")}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );
}

function ToggleCard({ label, desc, icon, isOn, onToggle }: any) {
  return (
    <button 
      onClick={onToggle}
      className={cn(
        "p-6 rounded-3xl border-2 text-left transition-all group flex flex-col justify-between gap-4 active:scale-[0.98]",
        isOn ? "bg-white border-indigo-500 shadow-xl shadow-indigo-50" : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-200"
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", isOn ? "bg-indigo-500 text-white" : "bg-white text-slate-400 shadow-sm")}>
          {icon}
        </div>
        <div className={cn("w-10 h-6 rounded-full relative transition-all", isOn ? "bg-indigo-500" : "bg-slate-200")}>
          <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", isOn ? "left-5" : "left-1")} />
        </div>
      </div>
      <div>
        <p className="text-xs font-black text-slate-900 tracking-tight">{label}</p>
        <p className="text-[10px] font-bold text-slate-400 leading-tight mt-1">{desc}</p>
      </div>
    </button>
  );
}

function Toggle({ label, isOn, onToggle }: any) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
      <button 
        onClick={onToggle}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all shadow-inner",
          isOn ? "bg-emerald-500" : "bg-slate-200"
        )}
      >
        <div className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-md",
          isOn ? "left-6.5" : "left-0.5"
        )} />
      </button>
    </div>
  );
}
