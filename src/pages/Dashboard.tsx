import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Zap, CheckSquare, Dumbbell, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatTime, cn } from '../lib/utils';
import { Task, VibeMode } from '../types';

export default function Dashboard() {
  const { t } = useTranslation();
  const { profile, vibeMode, setVibeMode } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayTasks = async () => {
      if (!profile) return;
      const q = query(
        collection(db, `users/${profile.id}/tasks`),
        where('completed', '==', false),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snapshot = await getDocs(q);
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    };

    fetchTodayTasks();
  }, [profile]);

  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Good morning, {profile?.displayName?.split(' ')[0]}</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{dateStr}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-full">
            {(['hustle', 'balance', 'zen'] as VibeMode[]).map(mode => (
              <div key={mode} className="relative group">
                <button 
                  onClick={() => setVibeMode(mode)}
                  className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all",
                      vibeMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {mode}
                </button>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal w-48 z-50 shadow-xl font-bold text-center">
                  {t(`profile.vibe.${mode}`)}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase">System Stable</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="p-8 grid grid-cols-12 gap-6 flex-1">
        {/* Module 2: Energy Score Widget */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-4 card-minimal flex flex-col justify-between"
        >
          <div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Energy Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-light text-[var(--primary)] tracking-tighter">{profile?.energyScore}</span>
              <span className="text-slate-300 font-medium">/ 10</span>
            </div>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed italic">
                "You're primed for peak performance today. Focus on high-impact creative work."
            </p>
          </div>
          <div className="mt-8">
            <div className="flex justify-between text-[10px] uppercase font-black text-slate-400 mb-2">
              <span>Focus Level</span>
              <span className="text-[var(--primary)]">92%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  className="bg-[var(--primary)] h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Module 3: AI Task Timeline */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-8 card-minimal flex flex-col"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">AI Optimized Timeline</h3>
            <span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                {tasks.length} Pending Actions
            </span>
          </div>
          <div className="relative flex-1">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100"></div>
            <div className="space-y-6">
              {tasks.length > 0 ? tasks.map((task, idx) => (
                <div key={task.id} className="flex items-start gap-4">
                    <span className="w-12 text-[10px] font-bold text-slate-300 mt-1">{8 + idx}:30</span>
                    <div className={cn(
                        "flex-1 p-4 rounded-r-2xl border-l-4 transition-all",
                        idx === 0 ? "bg-teal-50 border-teal-500" : idx === 1 ? "bg-indigo-50 border-indigo-500" : "bg-slate-50 border-slate-300"
                    )}>
                        <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                        <p className="text-[10px] font-bold text-slate-500 opacity-80 uppercase tracking-tighter mt-1">
                            {task.category} • {task.duration}m • {task.priority} Priority
                        </p>
                    </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <CheckSquare className="h-10 w-10 opacity-20 mb-2" />
                    <p className="text-xs font-bold uppercase">No tasks scheduled</p>
                </div>
              )}
            </div>
          </div>
          <Link to="/tasks" className="mt-8 text-[10px] font-black text-[var(--primary)] uppercase tracking-widest text-center hover:opacity-70 transition-all">
            Manage All Tasks →
          </Link>
        </motion.div>

        {/* Module 5: Adaptive Goal */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-4 bg-gradient-to-br from-indigo-600 to-[var(--primary)] rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-100"
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                <Zap className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Insight Active</span>
          </div>
          <div>
            <h4 className="text-xl font-bold leading-tight">Focus on Project Phoenix</h4>
            <p className="text-sm text-indigo-100 mt-2 leading-relaxed font-medium">
                "Based on your high energy, you can finish the architectural refactor before lunch."
            </p>
          </div>
          <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm transition-all border border-white/10">
            Acknowledge Goal
          </button>
        </motion.div>

        {/* Weekly Consistency */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-5 card-minimal"
        >
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">Weekly Consistency</h3>
          <div className="flex items-end justify-between h-32 px-2 gap-2">
            {[40, 65, 85, 70, 45, 60, 20].map((h, i) => (
                <div key={i} className="flex-1 group relative">
                    <div 
                        className={cn(
                            "w-full rounded-t-xl transition-all duration-500",
                            i === 2 ? "bg-[var(--primary)]" : "bg-slate-100 group-hover:bg-slate-200"
                        )} 
                        style={{ height: `${h}%` }}
                    ></div>
                </div>
            ))}
          </div>
          <div className="flex justify-between text-[8px] font-black text-slate-300 mt-4 px-1">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <span key={d}>{d}</span>)}
          </div>
        </motion.div>

        {/* Status System */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="col-span-3 bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center text-center border border-slate-800"
        >
          <div className="w-14 h-14 rounded-full border-2 border-[var(--primary)] flex items-center justify-center mb-6 shadow-lg shadow-[var(--primary)]/20 text-[var(--primary)]">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h4 className="text-xs font-black uppercase tracking-widest">Status: Safe</h4>
          <p className="text-[10px] text-slate-400 mt-3 leading-relaxed font-medium">
            Burnout risk is currently 12%. Patterns indicate sustainable productivity.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
