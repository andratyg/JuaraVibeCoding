import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail,
  AuthError
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Mail, ArrowRight, CheckCircle2, User as UserIcon, AlertCircle, Loader2, Lock, Eye, EyeOff, Bot as BotIcon, Zap as ZapIcon, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import GoogleButton from '../components/auth/GoogleButton';
import PasswordInput from '../components/auth/PasswordInput';
import PasswordStrength from '../components/auth/PasswordStrength';

export default function LoginPage() {
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
      case 'auth/wrong-password': return 'Password salah. Coba lagi.';
      case 'auth/user-not-found': return 'Email tidak terdaftar.';
      case 'auth/email-already-in-use': return 'Email sudah digunakan.';
      case 'auth/weak-password': return 'Password terlalu lemah (min 8 karakter).';
      case 'auth/too-many-requests': return 'Terlalu banyak percobaan. Tunggu sebentar.';
      case 'auth/network-request-failed': return 'Koneksi bermasalah. Periksa internet kamu.';
      case 'auth/invalid-email': return 'Format email tidak valid.';
      default: return 'Terjadi kesalahan. Coba lagi.';
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
      setError('Password tidak cocok.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      
      // Initialize Firestore User Doc
      await setDoc(doc(db, 'users', cred.user.uid), {
        displayName: name,
        email: email,
        createdAt: new Date().toISOString(),
        energyScore: 5,
        streak: 0,
        vibeMode: 'balance'
      });
    } catch (err) {
      const authErr = err as AuthError;
      setError(getFirebaseErrorMessage(authErr.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Link reset password telah dikirim ke email Anda.');
      setError(null);
    } catch (err) {
      const authErr = err as AuthError;
      setError(getFirebaseErrorMessage(authErr.code));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans lg:flex-row" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Branding Section (Left - Desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden bg-slate-900 p-16 text-white lg:flex lg:w-[45%] lg:flex-col lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-3xl font-black shadow-lg shadow-[var(--primary)]/20">F</div>
            <h1 className="text-3xl font-black tracking-tighter text-white">FlowState</h1>
          </div>
          <p className="mt-6 text-xl text-slate-300 leading-relaxed font-medium">
            "Work smarter. Feel better. Every single day."
          </p>
        </div>

        <div className="space-y-10">
          <FeatureItem 
            icon={<Zap className="h-6 w-6" />} 
            title="Produktivitas Adaptif" 
            text="Jadwal yang menyesuaikan dengan level energimu setiap harinya." 
          />
          <FeatureItem 
            icon={<Bot className="h-6 w-6" />} 
            title="Wellness Coach AI" 
            text="Bimbingan personal yang memahami kondisi fisik dan mentalmu." 
          />
          <FeatureItem 
            icon={<AlertTriangle className="h-6 w-6" />} 
            title="Burnout Detection" 
            text="Deteksi dini resiko kelelahan berlebih sebelum itu terjadi." 
          />
        </div>

        <div className="text-slate-500 text-sm font-bold uppercase tracking-widest">
            Powered by Gemini 2.0 Flash
        </div>
      </motion.div>

      {/* Form Section (Right) */}
      <motion.div 
        initial={window.innerWidth < 1024 ? { opacity: 0, y: 40 } : { opacity: 0, x: 30 }}
        animate={window.innerWidth < 1024 ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-1 items-center justify-center px-4 py-12 md:px-8 lg:px-0"
      >
        <div className="w-full max-w-sm md:max-w-md lg:max-w-sm">
          {/* Mobile & Tablet Branding Header */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white text-2xl font-black mb-3">F</div>
             <h1 className="text-2xl font-black text-slate-900">FlowState</h1>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Productivity System</p>
          </div>

          {/* Tablet Branding Bar (md to lg) */}
          <div className="hidden md:flex lg:hidden w-full bg-teal-50 rounded-2xl p-6 mb-8 gap-6 justify-center flex-wrap border border-teal-100">
            <div className="flex items-center gap-3">
               <Zap className="h-5 w-5 text-teal-600" />
               <span className="text-[10px] font-black uppercase tracking-tight text-teal-800">Adaptive</span>
            </div>
            <div className="flex items-center gap-3">
               <Bot className="h-5 w-5 text-teal-600" />
               <span className="text-[10px] font-black uppercase tracking-tight text-teal-800">AI Coach</span>
            </div>
            <div className="flex items-center gap-3">
               <AlertTriangle className="h-5 w-5 text-teal-600" />
               <span className="text-[10px] font-black uppercase tracking-tight text-teal-800">Safety Guard</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isLogin ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Masuk
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!isLogin ? 'bg-[#1a1a2e] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Daftar
            </button>
          </div>

          <div className="w-full max-w-sm mx-auto overflow-y-auto max-h-[85vh] scrollbar-hide px-1">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
              {isLogin ? 'Masuk ke Akun' : 'Buat Akun Baru'}
            </p>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-3">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs mb-4">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-600 border border-emerald-100 mb-4">
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              {!isLogin && (
                <div className="relative mb-3">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    autoCapitalize="none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm bg-white focus:border-[#4B4ACF] focus:outline-none transition-colors placeholder:text-gray-300 min-h-[44px] md:min-h-[48px]"
                  />
                </div>
              )}

              <div className="relative mb-3">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  inputMode="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm bg-white focus:border-[#4B4ACF] focus:outline-none transition-colors placeholder:text-gray-300 min-h-[44px] md:min-h-[48px]"
                />
              </div>

              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
              
              {!isLogin && (
                <>
                  <PasswordStrength password={password} />
                  <PasswordInput 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Konfirmasi Password" 
                  />
                </>
              )}

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-[10px] font-black uppercase tracking-widest text-[#4B4ACF] hover:underline py-2"
                  >
                    Lupa password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4B4ACF] hover:bg-[#3a39be] active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] md:min-h-[48px]"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Buat Akun'}
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">atau {isLogin ? 'masuk' : 'daftar'} dengan</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <GoogleButton label="Lanjutkan dengan Google" />

              <p className="text-center text-xs text-gray-500 mt-6">
                {isLogin ? (
                  <>Belum punya akun? <button type="button" onClick={() => setIsLogin(false)} className="text-[#4B4ACF] font-bold hover:underline">Daftar sekarang</button></>
                ) : (
                  <>Sudah punya akun? <button type="button" onClick={() => setIsLogin(true)} className="text-[#4B4ACF] font-bold hover:underline">Masuk</button></>
                )}
              </p>
            </form>
          </div>
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
