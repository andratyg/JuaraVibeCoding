import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { doc, setDoc, query, collection, where, limit, getDocs, updateDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ArrowRight, Loader2, Brain, Target, Activity, Flame, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fadeInUp, cardHover } from '../utils/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SkeletonPage } from '../components/ui/Skeletons';

export default function EnergyCheckInPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile, setVibeMode } = useApp();
  const navigate = useNavigate();
  
  const [energyLevel, setEnergyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [focusLevel, setFocusLevel] = useState(5);
  const [moodState, setMoodState] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<'intro' | 'chat' | 'result'>('intro');
  const [alreadyCalibrated, setAlreadyCalibrated] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    setTodayStr(today);
  }, []);

  useEffect(() => {
    const checkDailyStatus = async () => {
      if (!user) return;
      
      try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const docSnap = await getDocs(query(
          collection(db, `users/${user.uid}/checkins`),
          where('date', '==', today),
          limit(1)
        )).catch(e => {
          if (e.message?.includes('offline')) {
            console.warn('Checkin status fetch: client is offline');
            return { empty: true, docs: [] } as any;
          }
          throw e;
        });
        
        if (!docSnap.empty) {
          const data = docSnap.docs[0].data();
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
  }, [user]);

  const handleCalibrate = async () => {
    if (!profile) return;
    setIsAnalyzing(true);
    // Move to result step to show loading brain
    setStep('result');

    try {
      const result = await geminiService.analyzeEnergyCheckIn(
        energyLevel,
        stressLevel,
        focusLevel,
        moodState || 'Normal'
      );
      
      const now = new Date();
      const checkinDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const checkinData = {
        ...result,
        energyScore: energyLevel,
        energi: energyLevel,
        stres: stressLevel,
        fokus: focusLevel,
        mood: moodState || 'Normal',
        date: checkinDate,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, `users/${profile.id}/checkins`, checkinDate), checkinData);
      
      // Update energyScore on the user's profile so it cascades to other modules (TaskManager, FocusTimer, etc)
      await updateDoc(doc(db, `users`, profile.id), {
        energyScore: checkinData.energyScore,
        lastCheckInDate: checkinDate
      });

      setResult(checkinData);
      setAlreadyCalibrated(true);
      
      // Update Vibe Mode — context update
      const mode = result.mode?.toLowerCase()?.includes('fokus') || result.mode?.toLowerCase()?.includes('deep') ? 'deep-work' : 
                   result.mode?.toLowerCase()?.includes('recovery') || result.mode?.toLowerCase()?.includes('pulih') ? 'recovery' : 'balance';
      setVibeMode?.(mode as any);

      toast.success('Energi berhasil diperbarui!');
      await refreshProfile();
    } catch (error: any) {
      console.error('Error Calibration:', error);
      handleFirestoreError(error, OperationType.WRITE, `users/${profile.id}/checkins`);
      toast.error(error.message || 'Gagal kalibrasi.');
      setStep('chat');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return <SkeletonPage />;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 min-h-[calc(100vh-160px)] flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            {...fadeInUp}
            className="text-center space-y-8 max-w-lg"
          >
            <div className="space-y-2">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">{todayStr}</p>
               <div className="mx-auto w-24 h-24 bg-[var(--accent-bg)] text-[var(--accent-text)] rounded-[32px] flex items-center justify-center shadow-lg shadow-[var(--accent)]/10">
                 <Brain size={48} className="animate-pulse" />
               </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                {t('energyCheck.title')}
              </h1>
              <p className="text-sm md:text-lg opacity-80" style={{ color: 'var(--text2)' }}>
                {t('energyCheck.desc')}
              </p>
            </div>
            <Button
              size="lg"
              fullWidth
              onClick={() => setStep('chat')}
              icon={ArrowRight}
            >
              {alreadyCalibrated ? 'Update Kalibrasi Hari Ini' : t('energyCheck.startNow')}
            </Button>
            {alreadyCalibrated && (
              <p className="text-[10px] font-bold text-[var(--text3)] uppercase">Kamu sudah melakukan kalibrasi hari ini. Kamu bisa memperbaruinya jika merasa ada perubahan energi.</p>
            )}
          </motion.div>
        )}

        {step === 'chat' && (
          <motion.div
            key="chat"
            {...fadeInUp}
            className="w-full max-w-2xl"
          >
            <Card className="p-8 md:p-12 space-y-10">
              <h2 className="text-2xl font-bold">{t('energyCheck.conditionHeader')}</h2>
              
              <div className="space-y-8">
                {/* Energy Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text3)' }}>
                       <Zap size={16} className="text-[var(--warning)]" /> {t('energyCheck.energyLevel')}
                    </label>
                    <span className="text-2xl font-bold text-[var(--accent)]">{energyLevel}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={energyLevel} onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[10px] font-bold opacity-50 uppercase">
                    <span>{t('energyCheck.energyLemas')}</span>
                    <span>{t('energyCheck.energyBerenergi')}</span>
                  </div>
                </div>

                {/* Stress Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text3)' }}>
                       <Activity size={16} className="text-[var(--danger)]" /> {t('energyCheck.stressLevel')}
                    </label>
                    <span className="text-2xl font-bold text-[var(--danger)]">{stressLevel}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={stressLevel} onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface)] rounded-full appearance-none cursor-pointer accent-[var(--danger)]"
                  />
                  <div className="flex justify-between text-[10px] font-bold opacity-50 uppercase">
                    <span>{t('energyCheck.stressTenang')}</span>
                    <span>{t('energyCheck.stressBurnout')}</span>
                  </div>
                </div>

                {/* Focus Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text3)' }}>
                       <Target size={16} className="text-[var(--accent)]" /> {t('energyCheck.focusLevel')}
                    </label>
                    <span className="text-2xl font-bold text-[var(--accent)]">{focusLevel}/10</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1"
                    value={focusLevel} onChange={(e) => setFocusLevel(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[var(--surface)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[10px] font-bold opacity-50 uppercase">
                    <span>{t('energyCheck.focusBlurry')}</span>
                    <span>{t('energyCheck.focusLaser')}</span>
                  </div>
                </div>

                {/* Mood Input */}
                <Input 
                  label={t('energyCheck.moodLabel')}
                  value={moodState}
                  onChange={(e) => setMoodState(e.target.value)}
                  placeholder={t('energyCheck.moodPlaceholder')}
                />

                <Button
                  fullWidth
                  size="lg"
                  loading={isAnalyzing}
                  onClick={handleCalibrate}
                  icon={ArrowRight}
                >
                  {t('energyCheck.analyzeAction')}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            {...fadeInUp}
            className="w-full max-w-3xl space-y-6"
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--accent)]">
                    <Brain size={32} />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">{t('energyCheck.analyzing')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text3)' }}>AI sedang memproses kondisimu...</p>
                </div>
              </div>
            ) : result && (
              <div className="space-y-6">
                {/* Result Hero */}
                <Card accent className="p-8 md:p-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-4 flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                        <Zap size={14} className="text-yellow-300" /> 
                        {alreadyCalibrated ? t('energyCheck.calibrationHistory') : t('energyCheck.dailyResult')}
                      </div>
                      <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{result.mode}</h2>
                      <p className="text-lg font-medium italic opacity-90 leading-relaxed">
                        "{result.quote}"
                      </p>
                    </div>
                    <div className="text-center md:text-right flex flex-col justify-center">
                      <div className="text-7xl md:text-8xl font-black leading-none">{result.energyScore}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-2">Energy Score</div>
                    </div>
                  </div>
                </Card>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScoreCard 
                    label={t('energyCheck.scoreEnergy')} 
                    value={result.energi} 
                    icon={<Activity size={18} />} 
                    color="var(--success)"
                    desc={result.modeReason} 
                  />
                  <ScoreCard 
                    label="Kesehatan Mental" 
                    value={result.stres} 
                    icon={<Flame size={18} />} 
                    color="var(--danger)"
                    desc="Level stres kamu saat ini. Tetap tenang dan lakukan pernapasan jika perlu." 
                  />
                  <ScoreCard 
                    label={t('energyCheck.scoreFocus')} 
                    value={result.fokus} 
                    icon={<Target size={18} />} 
                    color="var(--accent)"
                    desc="Konsentrasi kamu sedang optimal untuk tugas-tugas berat." 
                  />
                  <Card className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[var(--warning)]">
                      <Sparkles size={18} />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Top Recommendation</h4>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{result.topTip}</p>
                  </Card>
                </div>

                {/* AI Detail Card */}
                <Card className="p-8 md:p-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] flex items-center justify-center text-[var(--accent)]">
                      <Brain size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t('energyCheck.strategyHeader')}</h3>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>Strategi kerja berbasis AI sesuai level energimu.</p>
                    </div>
                  </div>
                  
                  {result.narasi && (
                    <div className="text-sm bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] leading-relaxed italic">
                      "{result.narasi}"
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.workSlots?.map((slot: string, i: number) => (
                      <div key={i} className="flex gap-3 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] group transition-all hover:border-[var(--accent)]">
                        <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Zap size={12} />
                        </div>
                        <p className="text-sm font-medium">Jendela Fokus: <span className="text-[var(--accent)]">{slot}</span></p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Footer Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <Button
                    size="lg"
                    onClick={() => navigate('/tasks')}
                    icon={ArrowRight}
                  >
                    {t('energyCheck.actionPlan')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setStep('chat')}
                    icon={Activity}
                  >
                    Kalibrasi Ulang
                  </Button>
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
  return (
    <Card className="space-y-4 h-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--surface)]" style={{ color }}>
            {icon}
          </div>
          <h4 className="font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--text3)' }}>{label}</h4>
        </div>
        <div className="text-xl font-bold">{value}<span className="text-xs opacity-30">/10</span></div>
      </div>

      <div className="h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 10}%` }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      <p className="text-[10px] font-medium leading-relaxed" style={{ color: 'var(--text2)' }}>
        {desc}
      </p>
    </Card>
  );
}
