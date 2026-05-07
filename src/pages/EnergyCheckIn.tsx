import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight, Loader2, MessageSquare, Brain, Target, Activity, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function EnergyCheckInPage() {
  const { profile, refreshProfile } = useApp();
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'intro' | 'chat' | 'result'>('intro');
  const [alreadyCalibrated, setAlreadyCalibrated] = useState(false);

  useEffect(() => {
    const checkDailyStatus = async () => {
      if (!profile) return;
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const q = query(
          collection(db, `users/${profile.id}/energyCheckIns`),
          where('createdAt', '>=', today.toISOString()),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setResult(data);
          setStep('result');
          setAlreadyCalibrated(true);
        }
      } catch (error) {
        console.error("Error checking daily status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkDailyStatus();
  }, [profile]);

  const handleCalibrate = async () => {
    if (!profile || !userInput.trim()) return;
    setLoading(true);
    setStep('result');

    try {
      const analysis = await geminiService.calibrateDaily(userInput);
      
      const checkInData = {
        energy: analysis.energy,
        stress: analysis.stress,
        focus: analysis.focus,
        enthusiasm: analysis.enthusiasm,
        score: analysis.score,
        mode: analysis.mode,
        quote: analysis.quote,
        recommendations: analysis.recommendations,
        explanation: analysis.explanation,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, `users/${profile.id}/energyCheckIns`), checkInData);
      await updateDoc(doc(db, 'users', profile.id), {
        energyScore: analysis.score,
        lastCheckIn: new Date().toISOString(),
      });
      
      setResult(analysis);
      await refreshProfile();
    } catch (error) {
      console.error('Error Calibration:', error);
      setStep('chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8 max-w-lg"
          >
            <div className="inline-flex items-center justify-center p-4 bg-indigo-100 text-indigo-600 rounded-3xl mb-4">
              <Brain size={48} className="animate-pulse" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Daily <span className="text-indigo-600">Calibration</span>
              </h1>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Mari kita selaraskan energi dan fokusmu hari ini. Ceritakan perasaanmu, dan biarkan AI membantu menerjemahkannya menjadi strategi optimal.
              </p>
            </div>
            <button
              onClick={() => setStep('chat')}
              className="group flex items-center justify-center gap-3 w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg transition-all hover:bg-slate-800 hover:scale-[1.02]"
            >
              Mulai Kalibrasi <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {step === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full space-y-8"
          >
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <MessageSquare size={120} />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="space-y-2">
                    <div className="bg-slate-100 p-6 rounded-3xl rounded-tl-none inline-block">
                      <p className="text-slate-800 font-bold leading-relaxed text-base md:text-lg">
                         Selamat pagi, {profile?.displayName?.split(' ')[0]}! <br/>
                         Bagaimana perasaanmu pagi ini? Ceritakan apa saja yang ada di pikiranmu, tingkat semangatmu, atau apa yang kamu rasakan secara fisik. 
                         Jangan sungkan bercerita apa adanya.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Contoh: 'Pagi ini lumayan semangat, habis olahraga lari tadi. Tapi agak kepikiran deadline nanti siang, jadi sedikit deg-degan...'"
                    className="w-full min-h-[180px] p-8 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[32px] text-slate-800 font-medium text-lg outline-none transition-all resize-none shadow-inner"
                  />
                  <button
                    onClick={handleCalibrate}
                    disabled={!userInput.trim() || loading}
                    className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-200"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Analisis Kondisiku <MessageSquare size={20} /></>}
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
              AI akan menerjemahkan ceritamu ke dalam metrik kuantitatif
            </p>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl space-y-8"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative h-24 w-24">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-100/50 border-t-indigo-600 animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Brain size={32} />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Gemini sedang menganalisis perasaanmu...</h3>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Menerjemahkan emosi ke angka</p>
                </div>
              </div>
            ) : result && (
              <div className="space-y-8">
                {/* Header Card */}
                {alreadyCalibrated && (
                  <div className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">
                    <CheckCircle2 size={14} /> Today's Calibration Protocol is Locked & Optimized
                  </div>
                )}
                <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/30">
                        <Zap size={14} /> {alreadyCalibrated ? 'Calibration History' : 'Daily Result'}
                      </div>
                      <h2 className="text-5xl font-black tracking-tight">{result.mode}</h2>
                      <p className="text-slate-400 font-bold italic text-lg leading-relaxed">
                        "{result.quote}"
                      </p>
                    </div>
                    <div className="text-center md:text-right">
                      <div className="relative inline-block">
                        <div className="text-7xl font-black text-indigo-400 leading-none">{result.score}</div>
                        <div className="text-xs font-black text-indigo-200 uppercase tracking-widest mt-2">Productivity Potential</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <ScoreCard 
                      label="Energy Level" 
                      value={result.energy} 
                      icon={<Activity className="text-emerald-500" />} 
                      color="emerald"
                      desc={result.explanation.energy} 
                    />
                   <ScoreCard 
                      label="Stress Level" 
                      value={result.stress} 
                      icon={<Flame className="text-rose-500" />} 
                      color="rose"
                      desc={result.explanation.stress} 
                    />
                   <ScoreCard 
                      label="Focus Level" 
                      value={result.focus} 
                      icon={<Target className="text-blue-500" />} 
                      color="blue"
                      desc={result.explanation.focus} 
                    />
                   <ScoreCard 
                      label="Enthusiasm" 
                      value={result.enthusiasm} 
                      icon={<Flame className="text-orange-500" />} 
                      color="orange"
                      desc={result.explanation.enthusiasm} 
                    />
                </div>

                {/* Recommendations */}
                <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Sparkles size={28} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">Optimal Strategy</h3>
                    <p className="text-slate-500 font-medium">Berdasarkan kondisimu, berikut adalah langkah yang disarankan oleh AI:</p>
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    {result.recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={14} />
                        </div>
                        <p className="text-slate-700 font-bold text-sm md:text-base leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/tasks')}
                    className="flex items-center justify-center gap-3 p-6 bg-slate-900 text-white font-black rounded-[24px] text-lg shadow-xl hover:bg-slate-800 transition-all hover:scale-[1.02]"
                  >
                    Action Plan <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="p-6 bg-white text-slate-600 font-black rounded-[24px] text-lg border border-slate-200 transition-all hover:bg-slate-50"
                  >
                    Back to Feed
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreCard({ label, value, icon, color, desc }: any) {
  const getProgressColor = (val: number, col: string) => {
    const colors: any = {
      emerald: 'bg-emerald-500',
      rose: 'bg-rose-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500'
    };
    return colors[col] || 'bg-indigo-500';
  };

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100 space-y-6 group hover:-translate-y-1 transition-all">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-${color}-50`}>
            {icon}
          </div>
          <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{label}</h4>
        </div>
        <div className="text-2xl font-black text-slate-900 leading-none">{value}<span className="text-slate-300 text-sm">/10</span></div>
      </div>

      <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn("absolute inset-0 h-full rounded-full transition-all", getProgressColor(value, color))}
        />
      </div>

      <p className="text-xs font-bold text-slate-500 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
