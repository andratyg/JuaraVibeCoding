import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Mail, Camera, CheckCircle, AlertCircle, Loader2, Save,
  Shield, Bell, Monitor, Moon, Sun, ChevronRight,
  Database, Trash2, ShieldCheck, Lock, Zap,
  Activity, Share2, HelpCircle, ExternalLink, Github, Twitter, Linkedin,
  MoreVertical, CreditCard, LogOut, UserCog, Sparkles, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth, db, handleFirestoreError, OperationType } from '../config/firebase';
import { 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { fadeInUp, stagger, fadeIn } from '../utils/animations';
import { toast } from 'react-hot-toast';

type ProfileTab = 'account' | 'security' | 'preferences' | 'activity' | 'social' | 'help';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, profile, refreshProfile } = useApp();
  
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [loading, setLoading] = useState(false);

  // --- Account Form States ---
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // --- Activity State ---
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
    }
  }, [profile, user]);

  const fetchActivityPulse = async () => {
    if (!user) return;
    try {
      const energyPath = `users/${user.uid}/energyCheckIns`;
      const q = query(collection(db, energyPath), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q).catch(e => {
        if (e.message?.includes('offline')) {
          console.warn('Activity pulse fetch: client is offline');
          return { docs: [] } as any;
        }
        throw e;
      });
      const logs = snap.docs.map(d => {
          const data = d.data();
          const date = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt);
          return {
            id: d.id,
            title: 'Sinkronisasi Energi',
            time: date.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
            icon: <Zap size={14} className="text-amber-500" />
          };
      });
      setActivities(logs);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/energyCheckIns`);
    }
  };

  useEffect(() => {
    if (activeTab === 'activity') fetchActivityPulse();
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        fullName: fullName.trim(),
        bio: bio.trim()
      });
      
      await refreshProfile();
      toast.success(t('common.success'));
    } catch (err: any) {
      toast.error(t('common.error'));
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'account', label: t('profile.tabs.account'), icon: User },
    { id: 'security', label: t('profile.tabs.security'), icon: Shield },
    { id: 'preferences', label: t('profile.tabs.preferences'), icon: Monitor },
    { id: 'activity', label: t('profile.tabs.activity'), icon: Activity },
    { id: 'help', label: t('profile.tabs.help'), icon: HelpCircle },
  ];

  return (
    <motion.div {...fadeInUp} className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('dashboard.profileSettings')}</h1>
          <p className="text-sm text-[var(--text2)]">{t('dashboard.manageAccount')}</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => auth.signOut()} icon={LogOut}>
            {t('nav.logout')}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                    <div className="h-24 w-24 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] overflow-hidden flex items-center justify-center shadow-inner">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : (
                            <User size={32} className="text-[var(--text3)]" />
                        )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-[var(--accent)] text-white rounded-full border-4 border-[var(--surface2)] shadow-lg hover:scale-110 transition-transform">
                        <Camera size={14} />
                    </button>
                </div>
                <div>
                   <h2 className="font-bold text-lg">{profile?.fullName || user?.displayName || 'User'}</h2>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Pro Member</p>
                </div>
            </Card>

            <div className="flex flex-col gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                            activeTab === tab.id 
                            ? "bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent)]/20" 
                            : "text-[var(--text2)] hover:bg-[var(--surface)]"
                        )}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    {...fadeIn}
                    className="min-h-[400px]"
                >
                    {activeTab === 'account' && (
                        <Card className="p-8 space-y-8">
                            <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
                                <UserCog className="text-[var(--accent)]" size={24} />
                                <div>
                                    <h3 className="text-xl font-bold">{t('dashboard.accountDetails')}</h3>
                                    <p className="text-xs text-[var(--text2)]">{t('dashboard.updateBasicInfo')}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.fullName')}</label>
                                        <input 
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] px-4 py-3 outline-none focus:border-[var(--accent)] transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.username')}</label>
                                        <input 
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] px-4 py-3 outline-none focus:border-[var(--accent)] transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('profile.bio')}</label>
                                    <textarea 
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] px-4 py-3 outline-none focus:border-[var(--accent)] transition-all font-medium resize-none"
                                    />
                                </div>

                                <Button loading={loading} type="submit" icon={Save}>
                                    {t('profile.saveChanges')}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="p-8 space-y-8">
                             <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
                                <Shield className="text-[var(--accent)]" size={24} />
                                <div>
                                    <h3 className="text-xl font-bold">{t('dashboard.securityDetails')}</h3>
                                    <p className="text-xs text-[var(--text2)]">{t('dashboard.manageSecurity')}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6 bg-[var(--surface)] border-[var(--border)] space-y-4">
                                    <div className="h-10 w-10 bg-[var(--surface2)] text-[var(--accent)] rounded-xl flex items-center justify-center border border-[var(--border)]">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Reset Kata Sandi</h4>
                                        <p className="text-[10px] text-[var(--text2)] mt-1">{t('dashboard.resetPasswordDesc')}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => sendPasswordResetEmail(auth, user?.email || '')} className="w-full">
                                        {t('dashboard.sendLink')}
                                    </Button>
                                </Card>

                                <Card className="p-6 bg-[var(--surface)] border-[var(--border)] space-y-4">
                                    <div className="h-10 w-10 bg-[var(--surface2)] text-[var(--success)] rounded-xl flex items-center justify-center border border-[var(--border)]">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{t('dashboard.googleAuth')}</h4>
                                        <p className="text-[10px] text-[var(--text2)] mt-1">{t('dashboard.googleAuthDesc')}</p>
                                    </div>
                                    <div className="px-3 py-1.5 bg-[var(--success-bg)] text-[var(--success)] text-[10px] font-bold rounded-lg border border-[var(--success)]/20 text-center uppercase tracking-widest">
                                        {t('dashboard.protected')}
                                    </div>
                                </Card>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'activity' && (
                        <Card className="p-8 space-y-8">
                             <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
                                <Activity className="text-[var(--accent)]" size={24} />
                                <div>
                                    <h3 className="text-xl font-bold">{t('profile.activity.title')}</h3>
                                    <p className="text-xs text-[var(--text2)]">{t('profile.activity.subtitle')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {activities.length > 0 ? activities.map(act => (
                                    <div key={act.id} className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl group hover:border-[var(--accent)] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--accent)]">
                                                {act.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold">{act.title}</h4>
                                                <p className="text-[10px] text-[var(--text2)]">{act.time}</p>
                                            </div>
                                        </div>
                                        <div className="px-2 py-1 bg-[var(--accent-bg)] text-[var(--accent)] text-[8px] font-black uppercase rounded-md tracking-widest border border-[var(--accent)]/10">
                                            Status: OK
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 opacity-30">
                                        <Activity size={40} className="mx-auto mb-2" />
                                        <p className="text-xs font-medium">Nadi Anda tenang..</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'preferences' && (
                        <Card className="p-8 space-y-8">
                            <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
                                <Monitor className="text-[var(--accent)]" size={24} />
                                <div>
                                    <h3 className="text-xl font-bold">{t('profile.tabs.preferences')}</h3>
                                    <p className="text-xs text-[var(--text2)]">Sesuaikan antarmuka dan pengalaman sistem.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('dashboard.interfaceLanguage')}</label>
                                    <div className="flex bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)]">
                                        {['en', 'id'].map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => i18n.changeLanguage(lang)}
                                                className={cn(
                                                    "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                    i18n.language === lang ? "bg-[var(--surface2)] text-[var(--accent)] shadow-sm" : "text-[var(--text3)]"
                                                )}
                                            >
                                                {lang === 'en' ? 'English' : 'Indonesia'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-[var(--text2)] uppercase tracking-wider">{t('dashboard.inputMethod')}</label>
                                    <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-md)] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Sparkles size={16} className="text-amber-500" />
                                            <span className="text-xs font-bold">{t('dashboard.smartInput')}</span>
                                        </div>
                                        <div className="h-5 w-10 bg-[var(--accent)] rounded-full relative">
                                            <div className="absolute top-1 left-5 h-3 w-3 bg-white rounded-full shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'help' && (
                        <Card className="p-8 space-y-8">
                             <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
                                <HelpCircle className="text-[var(--accent)]" size={24} />
                                <div>
                                    <h3 className="text-xl font-bold">{t('profile.help.title')}</h3>
                                    <p className="text-xs text-[var(--text2)]">Basis pengetahuan dan dukungan sistem.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <HelpCard label={t('profile.help.faq')} icon={Database} />
                               <HelpCard label={t('profile.help.contact')} icon={Mail} />
                               <HelpCard label={t('profile.help.docs')} icon={ExternalLink} />
                            </div>

                            <Card className="p-6 bg-slate-900 border-none relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Heart size={80} className="text-[var(--accent)]" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <h4 className="font-bold text-white">{t('dashboard.personalAssistance')}</h4>
                                    <p className="text-xs text-slate-400">{t('dashboard.contactSupport')}</p>
                                    <Button variant="primary" size="sm">
                                        {t('dashboard.contactUs')}
                                    </Button>
                                </div>
                            </Card>
                        </Card>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function HelpCard({ label, icon: Icon }: any) {
    return (
        <button className="flex flex-col items-center justify-center p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] transition-all gap-3 group">
            <div className="p-3 bg-[var(--surface2)] rounded-xl text-[var(--text2)] group-hover:text-[var(--accent)] transition-colors">
                <Icon size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text2)] group-hover:text-[var(--text)]">{label}</span>
        </button>
    );
}
