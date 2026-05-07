import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail,
  AuthError
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Mail, ArrowRight, CheckCircle2, User as UserIcon, AlertCircle, Loader2, Lock, Eye, EyeOff, Bot as BotIcon, Zap as ZapIcon, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import GoogleButton from '../components/auth/GoogleButton';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrength from '../components/auth/PasswordStrength';

export default function LoginPage() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const getFirebaseErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/wrong-password': return t('auth.errors.wrongPassword') || 'Incorrect password. Please try again.';
      case 'auth/user-not-found': return t('auth.errors.userNotFound') || 'No account found with this email.';
      case 'auth/email-already-in-use': return t('auth.errors.emailInUse') || 'This email is already registered.';
      case 'auth/weak-password': return t('auth.errors.weakPassword') || 'Password is too weak. Use at least 6 characters.';
      case 'auth/too-many-requests': return t('auth.errors.tooManyRequests') || 'Too many attempts. Try again later.';
      case 'auth/network-request-failed': return t('auth.errors.networkError') || 'Network error. Check your connection.';
      case 'auth/invalid-email': return t('auth.errors.invalidEmail') || 'Please enter a valid email address.';
      default: return t('common.error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authErr = err as AuthError;
      setError(getFirebaseErrorMessage(authErr.code));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('common.error'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      
      const newProfile = {
        displayName: name,
        fullName: name,
        email: email,
        createdAt: new Date().toISOString(),
        energyScore: 5,
        streak: 0,
        vibeMode: 'balance',
        settings: {
          notifications: { email: true, push: true, messages: false, alerts: true },
          privacy: { visibility: 'public', dataSharing: true },
          aiPreferences: { coachTone: 'balanced', nudgeFrequency: 'normal', focusAreas: [] },
          accessibility: { highContrast: false, fontScale: 1, reducedMotion: false },
          theme: 'light'
        }
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (err) {
      const authErr = err as AuthError;
      setError(getFirebaseErrorMessage(authErr.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans lg:flex-row relative overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-50 rounded-full blur-[100px] pointer-events-none" />

      {/* Branding Section (Left - Desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden bg-slate-900 p-20 text-white lg:flex lg:w-[40%] lg:flex-col lg:justify-between relative z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-indigo-500 text-white shadow-2xl shadow-indigo-500/20">
                <ZapIcon size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white italic">FlowState</h1>
          </div>
          <p className="mt-10 text-2xl text-slate-300 leading-relaxed font-medium max-w-sm">
            "Your digital sanctuary for peak focus and recovery."
          </p>
        </div>

        <div className="space-y-12 relative z-10">
          <FeatureItem icon={<ZapIcon size={24} />} title="Adaptive Pulse" text="Systems that synchronize with your biological energy levels." />
          <FeatureItem icon={<BotIcon size={24} />} title="Intelligent Coach" text="AI-driven mentorship for your mental and physical wellness." />
        </div>

        <div className="relative z-10">
            <div className="h-px w-20 bg-slate-700 mb-6" />
            <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                Standard Interface v4.0.1
            </div>
        </div>
      </motion.div>

      {/* Form Section (Right) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-1 items-center justify-center p-8 relative z-10"
      >
        <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
          <div className="mb-12 text-center">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{isLogin ? t('common.signIn') : t('common.signUp')}</h2>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-3">{isLogin ? 'Welcome Back to the Flow' : 'Join the Global Productivity Engine'}</p>
          </div>

          <div className="flex gap-2 mb-10 bg-slate-50 p-1.5 rounded-2xl">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={cn(
                  "flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  isLogin ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {t('common.signIn')}
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={cn(
                "flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                !isLogin ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
            )}
            >
              {t('common.signUp')}
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-black uppercase tracking-widest animate-shake">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.fullName')}</label>
                <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-bold" />
                </div>
              </div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('profile.email')}</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-slate-900 focus:outline-none transition-all font-bold" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('common.password')}</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl text-[10px] shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? <ArrowRight size={18} /> : <CheckCircle2 size={18} />)}
              {isLogin ? t('common.signIn') : t('common.signUp')}
            </button>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-300">{t('common.orContinueWith')}</span></div>
            </div>

            <GoogleButton label="Google Identity" />

            <div className="text-center mt-10">
                <p className="text-[11px] font-bold text-slate-400">
                    {isLogin ? t('common.noAccount') : t('common.haveAccount')}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 text-indigo-600 font-black uppercase tracking-widest hover:underline">
                        {isLogin ? t('common.registerNow') : t('common.loginInstead')}
                    </button>
                </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[var(--primary)] text-white backdrop-blur-md">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed max-w-xs">{text}</p>
      </div>
    </div>
  );
}

function Zap({ className }: { className?: string }) { return <ZapIcon className={className} />; }
function Bot({ className }: { className?: string }) { return <BotIcon className={className} />; }
function AlertTriangle({ className }: { className?: string }) { return <AlertTriangleIcon className={className} />; }
