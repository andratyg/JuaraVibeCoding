import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useApp } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Activity, Brain } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Onboarding() {
  const { profile, refreshProfile } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form Data
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('Maintain Health');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('id');

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleComplete = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', profile.id), {
        onboardingDone: true,
        displayName,
        height,
        weight,
        fitnessGoal,
        workSlots: [`${workStart}-${workEnd}`],
        theme,
        language
      }, { merge: true });
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-[2rem] border border-[var(--border)] shadow-2xl">
        <div className="mb-8">
            <div className="flex gap-2 mb-6">
                {[1,2,3,4].map(s => (
                    <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--surface2)]'}`} />
                ))}
            </div>
            <h1 className="text-3xl font-bold mb-2">Selamat Datang di Velora.</h1>
            <p className="text-[var(--text2)] text-sm">Mari sesuaikan pengalamanmu.</p>
        </div>

        <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-4">
                        <label className="block text-sm font-bold uppercase tracking-widest text-[var(--text2)]">Nama Panggilan</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Misal: Budi"
                            className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                        <Button variant="primary" className="w-full mt-4" onClick={handleNext} disabled={!displayName}>Lanjut</Button>
                    </div>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-4">
                        <label className="block text-sm font-bold uppercase tracking-widest text-[var(--text2)]">Fisik & Tujuan Kebugaran</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                placeholder="Berat (kg)"
                                className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                            />
                            <input
                                type="number"
                                value={height}
                                onChange={e => setHeight(e.target.value)}
                                placeholder="Tinggi (cm)"
                                className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                        <select
                            value={fitnessGoal}
                            onChange={e => setFitnessGoal(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                        >
                            <option value="Maintain Health">Jaga Kesehatan</option>
                            <option value="Lose Weight">Turunkan Berat Badan</option>
                            <option value="Build Muscle">Bentuk Otot</option>
                        </select>
                        <div className="flex gap-4 mt-4">
                            <Button variant="secondary" className="flex-1" onClick={handleBack}>Kembali</Button>
                            <Button variant="primary" className="flex-1" onClick={handleNext}>Lanjut</Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {step === 3 && (
                <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-4">
                        <label className="block text-sm font-bold uppercase tracking-widest text-[var(--text2)]">Jam Kerja Dasar</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="time"
                                value={workStart}
                                onChange={e => setWorkStart(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                            />
                            <input
                                type="time"
                                value={workEnd}
                                onChange={e => setWorkEnd(e.target.value)}
                                className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                            />
                        </div>
                        <div className="flex gap-4 mt-4">
                            <Button variant="secondary" className="flex-1" onClick={handleBack}>Kembali</Button>
                            <Button variant="primary" className="flex-1" onClick={handleNext}>Lanjut</Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {step === 4 && (
                <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="space-y-4">
                        <label className="block text-sm font-bold uppercase tracking-widest text-[var(--text2)]">Preferensi Sistem</label>
                        <select
                            value={theme}
                            onChange={e => setTheme(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                        >
                            <option value="system">Sistem (Auto)</option>
                            <option value="dark">Mode Gelap</option>
                            <option value="light">Mode Terang</option>
                        </select>
                        
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="w-full bg-[var(--bg)] border border-[var(--border2)] rounded-2xl px-4 py-3 focus:outline-none focus:border-[var(--accent)]"
                        >
                            <option value="id">Bahasa Indonesia</option>
                            <option value="en">English</option>
                        </select>

                        <div className="flex gap-4 mt-4">
                            <Button variant="secondary" className="flex-1" onClick={handleBack}>Kembali</Button>
                            <Button variant="primary" icon={ArrowRight} className="flex-1" onClick={handleComplete} loading={loading}>Selesai</Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
