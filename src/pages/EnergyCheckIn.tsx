import { useState } from 'react';
import { useApp } from '../App';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EnergyCheckInPage() {
  const { profile, refreshProfile } = useApp();
  const navigate = useNavigate();
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(4);
  const [focus, setFocus] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!profile) return;
    setLoading(true);

    const analysis = await geminiService.analyzeEnergyCheckIn(energy, stress, focus);
    
    const checkInData = {
      energy,
      stress,
      focus,
      score: analysis.score,
      mode: analysis.mode,
      quote: analysis.quote,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, `users/${profile.id}/energyCheckIns`), checkInData);
      await updateDoc(doc(db, 'users', profile.id), {
        energyScore: analysis.score,
        lastCheckIn: new Date().toISOString(),
      });
      setResult(analysis);
      await refreshProfile();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-12"
          >
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-tight text-[var(--primary)] mb-4">Daily Calibration</h1>
              <p className="text-slate-500">Beri tahu AI bagaimana perasaanmu pagi ini untuk mengoptimalkan harimu.</p>
            </div>

            <div className="space-y-10">
              <Slider 
                label="Level Energi" 
                value={energy} 
                onChange={setEnergy} 
                icon="⚡" 
                description="Berapa kapasitas fisikmu saat ini?" 
              />
              <Slider 
                label="Level Stres" 
                value={stress} 
                onChange={setStress} 
                icon="🤯" 
                description="Seberapa banyak tekanan mental yang kamu rasakan?" 
              />
              <Slider 
                label="Tingkat Fokus" 
                value={focus} 
                onChange={setFocus} 
                icon="🎯" 
                description="Seberapa mudah kamu terdistraksi?" 
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Analisis dengan Gemini AI'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 p-10 bg-white rounded-3xl border border-slate-100 shadow-xl"
          >
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
              <Zap className="h-12 w-12" />
            </div>
            
            <div>
              <h2 className="text-5xl font-black text-[var(--primary)]">{result.score}/10</h2>
              <p className="text-xl font-bold mt-2">{result.mode}</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl italic text-slate-600">
              "{result.quote}"
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                   onClick={() => navigate('/tasks')}
                   className="flex items-center justify-center gap-2 p-4 bg-[var(--primary)] text-white font-bold rounded-2xl"
                >
                    Susun Jadwal <ArrowRight className="h-4 w-4" />
                </button>
                <button
                   onClick={() => navigate('/')}
                   className="p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl"
                >
                    Ke Dashboard
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slider({ label, value, onChange, icon, description }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span>{icon}</span> {label}
          </h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <span className="text-2xl font-black text-[var(--primary)]">{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
      />
      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
        <span>RENDAH</span>
        <span>MODERAT</span>
        <span>TINGGI</span>
      </div>
    </div>
  );
}
