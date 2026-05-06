import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Mail, Camera, CheckCircle, AlertCircle, Loader2, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../App';
import { auth, db } from '../lib/firebase';
import { 
  updateProfile
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form states
  const [username, setUsername] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      if (username !== user.displayName) {
        await updateProfile(user, { displayName: username });
        await updateDoc(doc(db, 'users', user.uid), { displayName: username });
      }
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">{t('profile.accountDetails')}</h1>
        <p className="text-slate-500 font-medium">Manage your public profile and identity</p>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <AnimatePresence mode="wait">
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Profile Picture Section */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border-4 border-white shadow-xl shadow-slate-200/50">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    ) : (
                      <User size={48} className="text-slate-400" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 h-10 w-10 bg-[var(--primary)] text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-110 transition-transform">
                    <Camera size={16} />
                  </button>
                </div>
                <h3 className="mt-4 font-black text-lg text-slate-900">{user?.displayName || 'FlowUser'}</h3>
                <p className="text-slate-400 text-sm font-medium">{user?.email}</p>
                <button className="mt-6 w-full py-3 px-4 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  {t('profile.uploadAvatar')}
                </button>
              </div>
            </div>

            {/* Account Details Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleUpdateAccount} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t('profile.accountDetails')}</h4>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase px-1">{t('profile.username')}</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[var(--primary)] focus:outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase px-1">{t('profile.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        value={email}
                        readOnly
                        className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent rounded-2xl text-slate-500 focus:outline-none transition-all font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-[var(--primary)] text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {t('profile.saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
      </AnimatePresence>
    </div>
  );
}
