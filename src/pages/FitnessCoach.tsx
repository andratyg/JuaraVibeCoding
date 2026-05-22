import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../App';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Workout } from '../types/index';
import { Dumbbell, CheckCircle, Sparkles, Trophy, Zap, Clock, Activity, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeInUp, itemFadeIn } from '../utils/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonPage } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';
import { saveFitnessProgram } from '../utils/firestoreHelpers';

export default function FitnessCoach() {
  const { t } = useTranslation();
  const { profile, dashboardData } = useApp();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [fetching, setFetching] = useState(true);

  // current energy resolving logic
  const currentEnergy = dashboardData?.todayCheckin?.energyScore ?? dashboardData?.energyScore ?? profile?.energyScore ?? 5;
  const [isCooldown, setIsCooldown] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  useEffect(() => {
    const fetchLatestWorkout = async () => {
      if (!profile?.id) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `gemini_fitness_${today}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.expiry > Date.now()) {
                setWorkout(parsed.data);
                setFetching(false);
                return;
            }
        }
        
        const q = query(collection(db, `users/${profile.id}/fitness`), orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q).catch(e => {
          if (e.message?.includes('offline')) {
            console.warn('Workouts fetch: client is offline');
            return { empty: true, docs: [] } as any;
          }
          throw e;
        });
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const w = Object.assign({
              id: snapshot.docs[0].id,
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
          }) as Workout;
          
          if (data.date === today) {
            setWorkout(w);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${profile.id}/fitness`);
      } finally {
        setFetching(false);
      }
    };
    fetchLatestWorkout();
  }, [profile?.id]);

  const generateWorkout = async () => {
    if (!profile?.id) return;
    setLoading(true);
    setCompleted(false);
    
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `gemini_fitness_${today}`;
    
    const toastId = toast.loading('⏳ Velora sedang menganalisis...');
    try {
      const { checkRateLimit } = await import('../utils/rateLimit');
      const { remaining } = await checkRateLimit(profile.id);
      setRemainingQuota(remaining);

      let newWorkout;
      try {
        newWorkout = await geminiService.generateFitnessProgram(
          profile,
          currentEnergy
        );
        if (!newWorkout.exercises || newWorkout.exercises.length === 0) {
          throw new Error('Gemini returned empty exercises list');
        }
      } catch (geminiError) {
        console.error('Gemini fallback activated due to error:', geminiError);
        newWorkout = {
          totalDuration: currentEnergy > 6 ? 45 : currentEnergy > 4 ? 30 : 15,
          intensity: currentEnergy > 6 ? 'Tinggi' : currentEnergy > 4 ? 'Sedang' : 'Rendah',
          estimatedCalories: currentEnergy > 6 ? 300 : currentEnergy > 4 ? 200 : 100,
          warmup: { duration: 5, description: "Pemanasan ringan, putar sendi dan peregangan dinamis." },
          exercises: [
            { name: "Jumping Jacks", sets: 3, reps: "15-20", restSeconds: 30, muscleGroup: "Cardio", formTip: "Jaga ritme dan nafas teratur", modification: "Step jacks jika tidak bisa melompat" },
            { name: "Bodyweight Squats", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Legs", formTip: "Punggung lurus, lutut tidak melebihi jari kaki", modification: "Squat setengah jika terasa berat" },
            { name: "Push Ups", sets: 3, reps: "8-12", restSeconds: 45, muscleGroup: "Chest", formTip: "Jaga dada sejajar, bokong tidak naik", modification: "Gunakan lutut sebagai tumpuan" },
            { name: "Plank", sets: 3, reps: "30-45 detik", restSeconds: 30, muscleGroup: "Core", formTip: "Kencangkan perut, punggung lurus", modification: "Plank di lutut" }
          ].slice(0, currentEnergy > 6 ? 4 : currentEnergy > 4 ? 3 : 2),
          cooldown: { duration: 5, description: "Peregangan statis dan pendinginan nafas." },
          motivationalMessage: "Kamu bisa melakukannya! Lakukan yang terbaik sesuai energi hari ini."
        };
      }
      
      const workoutData = {
        ...newWorkout,
        energyScoreAtTime: currentEnergy,
        completed: false,
      };

      await saveFitnessProgram(profile.id, workoutData);
      
      const wObj = { id: today, ...workoutData } as Workout;
      
      localStorage.setItem(cacheKey, JSON.stringify({
          data: wObj,
          expiry: Date.now() + 24 * 60 * 60 * 1000
      }));
      
      setWorkout(wObj);
      toast.success(t('common.success'), { id: toastId });

      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `users/${profile.id}/fitness`);
      toast.error(err.message || 'Error occurred', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
    toast.success('Latihan Selesai!');
  };

  if (fetching) return <SkeletonPage />;

  return (
    <motion.div {...fadeInUp} className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('fitness.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Program latihan adaptif yang disesuaikan dengan energimu.</p>
        </div>
        {(!completed) && (
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={generateWorkout}
              loading={loading}
              disabled={isCooldown}
              icon={Sparkles}
              variant={workout ? 'outline' : 'primary'}
            >
              {workout ? 'Generate Ulang' : t('fitness.generate')}
            </Button>
            {remainingQuota !== null && (
              <p className="text-xs opacity-50 font-medium">Analisis tersisa: {remainingQuota}</p>
            )}
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {!workout ? (
          <motion.div 
            {...itemFadeIn}
            className="text-center py-24 md:py-32 bg-[var(--surface)] rounded-[3rem] border border-[var(--border)] border-dashed flex flex-col items-center"
          >
            <div className="h-20 w-20 bg-[var(--surface2)] rounded-full flex items-center justify-center mb-6">
              <DumbbellIcon className="h-8 w-8 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Siap untuk bergerak?</h3>
            <p className="max-w-sm mx-auto px-6 text-sm font-medium opacity-60">Velora akan merancang rutinitas khusus berdasarkan <b>Tingkat Energi</b> kamu hari ini.</p>
          </motion.div>
        ) : completed ? (
          <motion.div 
            key="complete"
            {...itemFadeIn}
            className="text-center py-20 px-8 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-40 -mt-40" />
            <div className="relative z-10 space-y-6">
              <div className="h-24 w-24 bg-white/10 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <Trophy className="h-10 w-10 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">MISI SELESAI</h3>
                <p className="text-slate-400 max-w-md mx-auto text-sm font-medium">Kamu telah berhasil menyelesaikan sesi hari ini. Dirimu di masa depan pasti berterima kasih.</p>
              </div>
              <Button 
                  onClick={() => setWorkout(null)}
                  className="bg-white text-slate-900 hover:bg-slate-100"
              >
                  {t('common.done')}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="workout"
            {...fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Main workout header */}
            <div className="lg:col-span-12">
               <Card className="p-8 border-none bg-emerald-600 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
                          <Zap size={12} /> Protokol Aktif
                        </div>
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">{workout.intensity} Session</h2>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2 text-sm font-bold opacity-80">
                          <Clock size={16} /> {workout.totalDuration} {t('fitness.minutes') || 'Min'}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold opacity-80">
                          <Activity size={16} /> {workout.estimatedCalories} {t('fitness.calories')}
                        </div>
                      </div>
                    </div>
                    <Button 
                        onClick={handleComplete}
                        className="bg-white text-emerald-600 hover:bg-white/90 shadow-2xl"
                        icon={CheckCircle}
                    >
                        {t('fitness.markDone')}
                    </Button>
                  </div>
               </Card>
            </div>

            {/* AI Insight */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-6 bg-slate-900 text-slate-300 border-l-4 border-emerald-500">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-xl text-emerald-400 shrink-0">
                    <Brain size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">AI Trainer Profile</h4>
                    <p className="text-sm font-medium leading-relaxed italic">
                      "{workout.motivationalMessage || 'Semangat!'}"
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Exercise Sequence */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 ml-2">{t('fitness.exercises')}</h3>
              <div className="grid grid-cols-1 gap-3">
                {(!workout.exercises || workout.exercises.length === 0) ? (
                    <Card className="p-6 text-center text-sm opacity-60">Tidak ada latihan yang ditemukan atau sesi gagal dimuat sepenuhnya. Ketuk tombol Generate Ulang untuk mendapat program baru.</Card>
                ) : workout.exercises.map((ex: any, i: number) => (
                  <motion.div 
                    {...itemFadeIn}
                    key={i} 
                  >
                    <Card className="p-4 flex items-center gap-6 group hover:border-emerald-500 transition-all">
                      <div className="h-12 w-12 rounded-xl bg-[var(--surface)] flex items-center justify-center font-bold text-[var(--text3)] group-hover:bg-emerald-500 group-hover:text-white transition-all text-lg shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm mb-0.5">{ex.name}</h4>
                        <p className="text-xs opacity-60 line-clamp-1">{ex.formTip}</p>
                      </div>
                      <div className="shrink-0 px-4 py-2 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                        <div className="text-emerald-500 font-bold text-sm">{ex.sets} x {ex.reps}</div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const DumbbellIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="M3 21v-2" />
    <path d="M3 5V3" />
    <path d="M21 21v-2" />
    <path d="M21 5V3" />
    <path d="M3 7h1v10H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
    <path d="M21 7h-1v10h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
  </svg>
);
