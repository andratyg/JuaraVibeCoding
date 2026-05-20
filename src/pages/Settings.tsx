import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, Shield, Eye, Globe, Monitor, Moon, Sun, 
  ChevronRight, Database, Trash2, AlertCircle, Loader2,
  CheckCircle, Mail, MessageSquare, 
  Settings as SettingsIcon, Lock, Zap, ShieldCheck as ShieldCheckIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth, db, handleFirestoreError, OperationType } from '../config/firebase';
import { 
  doc, deleteDoc, updateDoc, collection, getDocs, query, where 
} from 'firebase/firestore';
import { 
  sendPasswordResetEmail
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { fadeInUp } from '../utils/animations';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, profile, theme, setTheme, refreshProfile } = useApp();
  const [loading, setLoading] = useState(false);
  
  // Local settings state
  const [notifications, setNotifications] = useState(profile?.settings?.notifications || {
    email: true, push: true, messages: false, alerts: true
  });
  const [privacy, setPrivacy] = useState(profile?.settings?.privacy || {
    visibility: 'public', dataSharing: true
  });
  const [aiPrefs, setAiPrefs] = useState(profile?.settings?.aiPreferences || {
    coachTone: 'balanced', nudgeFrequency: 'normal', focusAreas: ['Fitness', 'Mental Health']
  });
  const [accessibility, setAccessibility] = useState(profile?.settings?.accessibility || {
    highContrast: false, fontScale: 1, reducedMotion: false
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
      toast.success(t('common.success') || 'Pengaturan berhasil diperbarui');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
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

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Tautan reset kata sandi telah dikirim ke email Anda.');
    } catch (err: any) {
      toast.error('Gagal mengirim email reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const collectionsArr = ['tasks', 'energyCheckIns'];
      const exportData: any = { profile };
      
      for (const col of collectionsArr) {
        const q = query(collection(db, `users/${user.uid}/${col}`));
        const snap = await getDocs(q);
        exportData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pulse_data_${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data berhasil diekspor!');
    } catch (err: any) {
      toast.error('Gagal mengekspor data.');
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
      toast.success('Akun telah dihapus.');
    } catch (err) {
      toast.error('Gagal menghapus akun. Silakan login ulang.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div {... fadeInUp} className="space-y-8 pb-20">
      <header className="space-y-2">
        <div className="flex items-center gap-3 text-[var(--accent)] mb-2">
            <SettingsIcon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">System Preferences</span>
        </div>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">{t('profile.settings')}</h1>
        <p className="text-sm text-[var(--text2)] font-medium">Konfigurasi protokol dan antarmuka keamanan sistem Pulse Anda.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keamanan & Akses */}
        <SettingsSection 
          title={t('profile.security.title')} 
          subtitle={t('profile.security.subtitle')} 
          icon={ShieldCheckIcon}
        >
          <div className="space-y-6">
            <div className="pt-4">
               <button 
                 onClick={handleChangePassword}
                 className="w-full flex items-center justify-between p-4 bg-[var(--surface)] rounded-[var(--r-lg)] hover:bg-[var(--surface2)] transition-all group"
               >
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--text2)] group-hover:text-[var(--accent)] transition-colors border border-[var(--border)]">
                        <Lock size={18} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold">{t('profile.changePassword')}</p>
                        <p className="text-[10px] text-[var(--text2)]">{t('profile.security.changePasswordDesc')}</p>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-[var(--text3)] group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </SettingsSection>

        {/* AI & Persona */}
        <SettingsSection 
          title={t('profile.ai.title')} 
          subtitle={t('profile.ai.subtitle')} 
          icon={Zap}
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.ai.persona')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'balanced', label: t('profile.ai.tones.balanced') },
                  { id: 'tough', label: t('profile.ai.tones.tough') },
                  { id: 'supportive', label: t('profile.ai.tones.supportive') },
                  { id: 'stoic', label: t('profile.ai.tones.stoic') }
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => handleAiPrefChange('coachTone', tone.id)}
                    className={`p-3 rounded-[var(--r-md)] text-xs font-bold border transition-all ${
                        aiPrefs.coachTone === tone.id 
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-[var(--accent-bg)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--text3)]'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.ai.frequency')}</label>
              <div className="flex bg-[var(--surface)] p-1 rounded-[var(--r-md)] border border-[var(--border)]">
                {['low', 'normal', 'high'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => handleAiPrefChange('nudgeFrequency', freq)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[var(--r-sm)] transition-all ${
                      aiPrefs.nudgeFrequency === freq ? "bg-[var(--surface2)] text-[var(--accent)] shadow-sm border border-[var(--border)]" : "text-[var(--text3)]"
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text2)] leading-relaxed px-1">{t('profile.ai.frequencyDesc')}</p>
            </div>
          </div>
        </SettingsSection>

        {/* Preferensi Sistem */}
        <SettingsSection 
          title={t('profile.appearance.title')}
          subtitle="Tampilan dan Lokalisasi"
          icon={Monitor}
        >
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.language.select')}</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]" size={18} />
                <select 
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] text-sm font-bold appearance-none cursor-pointer focus:border-[var(--accent)] outline-none transition-all"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English (US)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text3)]">
                    <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
              <SettingsToggle 
                label={t('profile.accessibility.highContrast')} 
                isOn={accessibility.highContrast} 
                onToggle={() => handleToggleAccessibility('highContrast')} 
              />
              <SettingsToggle 
                label={t('profile.accessibility.reducedMotion')} 
                isOn={accessibility.reducedMotion} 
                onToggle={() => handleToggleAccessibility('reducedMotion')} 
              />
            </div>
          </div>
        </SettingsSection>

        {/* Notifikasi & Privasi */}
        <SettingsSection 
          title="Notifikasi & Privasi"
          subtitle="Manajemen Komunikasi"
          icon={Bell}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <NotificationCard 
                label="Email" 
                isOn={notifications.email} 
                icon={Mail} 
                onClick={() => handleToggleNotification('email')} 
               />
               <NotificationCard 
                label="Push" 
                isOn={notifications.push} 
                icon={Zap} 
                onClick={() => handleToggleNotification('push')} 
               />
            </div>

            <div className="pt-6 border-t border-[var(--border)] space-y-4">
                <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.privacy.visibility')}</label>
                <div className="flex bg-[var(--surface)] p-1 rounded-[var(--r-md)] border border-[var(--border)]">
                    {(['public', 'friends', 'private'] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => handleVisibilityChange(v)}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[var(--r-sm)] transition-all ${
                        privacy.visibility === v ? "bg-[var(--surface2)] text-[var(--accent)] shadow-sm border border-[var(--border)]" : "text-[var(--text3)]"
                        }`}
                    >
                        {t(`profile.privacy.${v}`)}
                    </button>
                    ))}
                </div>
                <SettingsToggle 
                    label={t('profile.privacy.dataSharing')} 
                    isOn={privacy.dataSharing} 
                    onToggle={() => handleTogglePrivacy('dataSharing')} 
                />
                <p className="text-[10px] text-[var(--text2)] leading-relaxed px-1 italic">
                    {t('profile.privacy.dataSharingDesc')}
                </p>
            </div>
          </div>
        </SettingsSection>

        {/* Manajemen Data */}
        <SettingsSection 
          title={t('profile.dataManagement.title')} 
          subtitle={t('profile.dataManagement.subtitle')} 
          icon={Database}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-[var(--surface)] border-[var(--border)] flex flex-col justify-between gap-6 hover:border-[var(--accent)] transition-all group">
              <div>
                <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
                    <Database size={14} className="text-[var(--accent)]" />
                    {t('profile.dataManagement.export')}
                </h4>
                <p className="text-[10px] text-[var(--text2)] leading-relaxed">{t('profile.dataManagement.exportDesc')}</p>
              </div>
              <Button onClick={handleExportData} variant="secondary" size="sm" className="w-full">
                Ekspor JSON
              </Button>
            </Card>

            <Card className="p-5 bg-[var(--error-bg)] border-[var(--error)]/20 flex flex-col justify-between gap-6 hover:border-[var(--error)]/40 transition-all">
              <div>
                <h4 className="text-sm font-bold text-[var(--error)] mb-1 flex items-center gap-2">
                    <Trash2 size={14} />
                    {t('profile.dataManagement.delete')}
                </h4>
                <p className="text-[10px] text-[var(--error)] opacity-70 leading-relaxed">{t('profile.dataManagement.deleteDesc')}</p>
              </div>
              <Button onClick={handleDeleteAccount} variant="danger" size="sm" className="w-full">
                Hapus Akun
              </Button>
            </Card>
          </div>
        </SettingsSection>
      </div>
    </motion.div>
  );
}

// Sub-components
function SettingsSection({ title, subtitle, icon: Icon, children }: any) {
    return (
        <Card className="flex flex-col h-full bg-[var(--surface2)] border-[var(--border)] p-8 space-y-8">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--surface)] text-[var(--accent)] rounded-2xl border border-[var(--border)] shadow-sm">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold leading-tight">{title}</h3>
                    <p className="text-[10px] text-[var(--text2)] font-bold uppercase tracking-[0.2em]">{subtitle}</p>
                </div>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </Card>
    );
}

function SettingsToggle({ label, isOn, onToggle }: any) {
    return (
        <div className="flex items-center justify-between py-1 px-1">
            <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
            <button 
                onClick={onToggle}
                className={`w-11 h-6 rounded-full relative transition-all duration-300 ${isOn ? 'bg-[var(--accent)] shadow-lg shadow-[var(--accent-bg)]' : 'bg-[var(--surface)] border border-[var(--border)]'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${isOn ? 'left-6 scale-110' : 'left-1'}`} />
            </button>
        </div>
    );
}

function NotificationCard({ label, isOn, icon: Icon, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`p-5 rounded-[var(--r-xl)] border transition-all duration-300 flex items-center justify-between group active:scale-[0.97] ${
                isOn 
                ? 'bg-[var(--accent-bg)] border-[var(--accent)] text-[var(--accent)]' 
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--text3)] hover:bg-[var(--surface2)] text-[var(--text2)]'
            }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={isOn ? 'text-[var(--accent)]' : 'text-[var(--text2)]'} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isOn ? 'text-[var(--accent)]' : 'text-[var(--text2)]'}`}>{label}</span>
            </div>
            <div className={`h-1.5 w-1.5 rounded-full transition-all ${isOn ? 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]' : 'bg-[var(--text3)]'}`} />
        </button>
    );
}
