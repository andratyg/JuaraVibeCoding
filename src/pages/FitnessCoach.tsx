import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Workout } from '../types';
import { Dumbbell, Play, CheckCircle, Loader2, Sparkles, Trophy, Zap, Clock, Activity, Brain } from 'lucide-react';
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
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">AI Fitness Coach</h1>
          <p className="text-xs md:text-sm font-bold text-slate-400 md:text-slate-500 uppercase tracking-widest">Adaptive workouts tailored to your energy.</p>
        </div>
        {!workout || completed ? (
          <button
            onClick={generateWorkout}
            disabled={loading}
            className="w-full md:w-auto bg-emerald-600 text-white px-6 py-4 md:py-3 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            Generate Plan
          </button>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {!workout ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 md:py-32 bg-emerald-50 rounded-[3rem] border-2 border-dashed border-emerald-100 flex flex-col items-center"
          >
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-8">
              <Dumbbell className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-emerald-900 mb-2">Ready to move?</h3>
            <p className="text-emerald-700/60 max-w-sm mx-auto px-6 text-sm font-medium">Gemini will design a custom routine based on your real-time <b>Energy Level</b>.</p>
          </motion.div>
        ) : completed ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 md:py-32 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="relative z-10">
              <div className="h-24 w-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-8">
                <Trophy className="h-10 w-10 text-yellow-400" />
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">MISSION COMPLETE</h3>
              <p className="text-slate-400 mb-10 max-w-md mx-auto font-medium px-6">You've successfully finished your session. Your future self is thanking you already.</p>
              <button 
                  onClick={() => setWorkout(null)}
                  className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl"
              >
                  Close Session
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12"
          >
            <div className="space-y-8">
              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full uppercase mb-6 border border-emerald-100">
                        <Zap size={12} /> Active Protocol
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">{workout.name}</h2>
                    <div className="flex gap-8 mt-6">
                        <div className="flex items-center gap-2.5 text-slate-400 font-black text-xs uppercase tracking-wider">
                            <Clock className="h-4 w-4 text-slate-300" /> {workout.duration} Min
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-400 font-black text-xs uppercase tracking-wider">
                            <Activity className="h-4 w-4 text-emerald-400" /> Dynamic
                        </div>
                    </div>
                    <button 
                        onClick={handleComplete}
                        className="mt-10 bg-slate-900 text-white w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl shadow-slate-200"
                    >
                        Mark as Complete <CheckCircle className="h-5 w-5" />
                    </button>
                </div>
                <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] text-slate-300 text-sm leading-relaxed border-l-4 border-emerald-500 font-medium">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white/10 rounded-lg text-emerald-400 mt-1">
                    <Brain size={18} />
                  </div>
                  <p>
                    AI Coach: "Based on your <b>{workout.energyScoreAtTime}/10</b> Energy Score, I've adjusted this <b>{workout.duration}m</b> session to maximize movement without total exhaustion. Focus on form over speed today."
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest ml-4">Workout Sequence</h3>
              <div className="space-y-4">
                {workout.exercises?.map((ex: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="bg-white p-6 rounded-[2rem] border border-slate-50 flex items-center gap-6 group hover:border-emerald-200 transition-all shadow-sm"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all text-xl shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 text-base mb-1">{ex.name}</h4>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1">{ex.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-emerald-500 font-black text-sm uppercase tracking-tighter">{ex.sets}x{ex.reps}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
