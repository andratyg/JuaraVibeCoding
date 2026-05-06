import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Workout } from '../types';
import { Dumbbell, Play, CheckCircle, Loader2, Sparkles, Trophy, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FitnessCoach() {
  const { profile } = useApp();
  const [workout, setWorkout] = useState<Partial<Workout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchLatestWorkout = async () => {
      if (!profile) return;
      const q = query(collection(db, `users/${profile.id}/workouts`), orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setWorkout(snapshot.docs[0].data() as Workout);
      }
    };
    fetchLatestWorkout();
  }, [profile]);

  const generateWorkout = async () => {
    if (!profile) return;
    setLoading(true);
    setCompleted(false);
    const newWorkout = await geminiService.generateFitnessProgram(
      profile.fitnessProfile || { goal: 'Bugar & Sehat', equipment: ['No equipment'] },
      profile.energyScore,
      profile.vibeMode
    );
    
    const workoutData = {
      ...newWorkout,
      energyScoreAtTime: profile.energyScore,
      completed: false,
      createdAt: new Date(),
    };

    await addDoc(collection(db, `users/${profile.id}/workouts`), workoutData);
    setWorkout(workoutData);
    setLoading(false);
  };

  const handleComplete = () => {
    setCompleted(true);
    // In real app, update Firestore
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Fitness Coach</h1>
          <p className="text-slate-500">Latihan adaptif berdasarkan energimu hari ini.</p>
        </div>
        {!workout || completed ? (
          <button
            onClick={generateWorkout}
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            Generate Plan
          </button>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {!workout ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-emerald-50 rounded-[2.5rem] border-2 border-dashed border-emerald-200"
          >
            <Dumbbell className="h-16 w-16 mx-auto mb-6 text-emerald-200" />
            <h3 className="text-xl font-bold text-emerald-800">Belum Ada Jadwal Latihan</h3>
            <p className="text-emerald-600/60 max-w-sm mx-auto mt-2">Gemini akan membuat program latihan yang pas dengan Energy Score kamu.</p>
          </motion.div>
        ) : completed ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-slate-900 rounded-[2.5rem] text-white"
          >
            <Trophy className="h-20 w-20 mx-auto mb-6 text-yellow-400" />
            <h3 className="text-3xl font-black mb-2">KERJA BAGUS!</h3>
            <p className="text-slate-400 mb-8">Kamu telah menyelesaikan sesi latihan hari ini. Konsistensi adalah kunci.</p>
            <button 
                onClick={() => setWorkout(null)}
                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-bold transition-all"
            >
                Tutup
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
                <div className="relative z-10">
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase w-fit mb-4">
                        Today's session
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">{workout.name}</h2>
                    <div className="flex gap-6 mt-4">
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Clock className="h-4 w-4" /> {workout.duration}m
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Zap className="h-4 w-4 text-emerald-500" /> Intense
                        </div>
                    </div>
                    <button 
                        onClick={handleComplete}
                        className="mt-8 bg-slate-900 text-white w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all"
                    >
                        Tandai Selesai <CheckCircle className="h-5 w-5" />
                    </button>
                </div>
                <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 italic text-slate-500 text-sm">
                "Berdasarkan Energy Score kamu <b>({workout.energyScoreAtTime}/10)</b>, Gemini menyarankan latihan {workout.duration} menit untuk menjaga tubuh tetap aktif tanpa menguras energi berlebihan."
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest ml-2">Exercises</h3>
              {workout.exercises?.map((ex: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center gap-4 group hover:border-emerald-200 transition-all shadow-sm"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{ex.name}</h4>
                    <p className="text-xs text-slate-400">{ex.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 font-black">{ex.sets} x {ex.reps}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
