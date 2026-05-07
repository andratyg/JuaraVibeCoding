import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, CheckSquare, Dumbbell, AlertTriangle, ArrowRight, Brain, Sparkles, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { formatTime, cn } from '../lib/utils';
import { Task, VibeMode } from '../types';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { profile, vibeMode, setVibeMode } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestCheckIn, setLatestCheckIn] = useState<any>(null);

  const [weeklyConsistency, setWeeklyConsistency] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  const [showSystemHelp, setShowSystemHelp] = useState(false);
  const [showVibeHelp, setShowVibeHelp] = useState(false);
  const [showSyncHelp, setShowSyncHelp] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;
      
      // 1. Fetch Today's Tasks
      const qTasks = query(
        collection(db, `users/${profile.id}/tasks`),
        where('completed', '==', false),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snapshotTasks = await getDocs(qTasks);
      setTasks(snapshotTasks.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));

      // 2. Fetch Latest Energy CheckIn
      const qCheckIn = query(
        collection(db, `users/${profile.id}/energyCheckIns`),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snapshotCheckIn = await getDocs(qCheckIn);
      if (!snapshotCheckIn.empty) {
        setLatestCheckIn(snapshotCheckIn.docs[0].data());
      }

      // 3. Fetch Weekly Consistency Data
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const qAllTasks = query(
        collection(db, `users/${profile.id}/tasks`),
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      );
      
      const snapshotAll = await getDocs(qAllTasks);
      const days = [0,0,0,0,0,0,0]; // Monday to Sunday
      const totals = [0,0,0,0,0,0,0];
      
      snapshotAll.docs.forEach(doc => {
        const d = doc.data();
        const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        const dayIndex = (date.getDay() + 6) % 7; // Convert Sun-Sat (0-6) to Mon-Sun (0-6)
        
        totals[dayIndex]++;
        if (d.completed || d.status === 'Completed') {
          days[dayIndex]++;
        }
      });
      
      const consistency = days.map((done, i) => 
        totals[i] > 0 ? Math.round((done / totals[i]) * 100) : 0
      );
      setWeeklyConsistency(consistency);

      setLoading(false);
    };

    fetchDashboardData();
  }, [profile]);

  const dateStr = new Date().toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Welcome Section & Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <section className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
            <Brain size={240} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">System Online • Protocol Active</span>
                <div className="relative ml-1">
                  <button 
                    onClick={() => setShowSystemHelp(!showSystemHelp)}
                    onMouseEnter={() => setShowSystemHelp(true)}
                    onMouseLeave={() => setShowSystemHelp(false)}
                    className="flex items-center"
                  >
                    <HelpCircle size={10} className="text-slate-300 cursor-help" />
                  </button>
                  <AnimatePresence>
                    {showSystemHelp && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 top-full mt-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl z-50 shadow-2xl leading-relaxed border border-white/5"
                      >
                        {t('help.system')}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                {t('dashboard.welcome')}, <span className="text-indigo-600">{profile?.displayName?.split(' ')[0]}</span>
              </h1>
              <p className="text-xs md:text-sm font-black text-slate-300 uppercase tracking-[0.2em]">{dateStr}</p>
            </div>
            
            <div className="mt-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('help.vibe.title')}</span>
                  <div className="relative">
                    <button 
                      onClick={() => setShowVibeHelp(!showVibeHelp)}
                      onMouseEnter={() => setShowVibeHelp(true)}
                      onMouseLeave={() => setShowVibeHelp(false)}
                      className="flex items-center"
                    >
                      <HelpCircle size={10} className="text-slate-300 cursor-help" />
                    </button>
                    <AnimatePresence>
                      {showVibeHelp && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute left-0 bottom-full mb-2 w-56 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl z-50 shadow-2xl leading-relaxed border border-white/5"
                        >
                          <b>Hustle:</b> {t('help.vibe.hustle').split(': ')[1]}<br/>
                          <b>Balance:</b> {t('help.vibe.balance').split(': ')[1]}<br/>
                          <b>Zen:</b> {t('help.vibe.zen').split(': ')[1]}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl md:rounded-full border border-slate-100">
                  {(['hustle', 'balance', 'zen'] as VibeMode[]).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setVibeMode(mode)}
                      className={cn(
                          "px-6 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl md:rounded-full transition-all",
                          vibeMode === mode ? "bg-slate-900 text-white shadow-xl" : "text-slate-400 hover:text-slate-900"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/analytics" className="mt-8 md:mt-0 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                 {t('dashboard.viewPerformance')} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Productivity vs Wellness Pulse */}
        <section className="bg-slate-900 p-8 md:p-10 rounded-[3rem] text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20">
             <Zap className="h-40 w-40 text-emerald-400" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">{t('dashboard.performanceSync')}</h3>
              <div className="relative">
                <button 
                  onClick={() => setShowSyncHelp(!showSyncHelp)}
                  onMouseEnter={() => setShowSyncHelp(true)}
                  onMouseLeave={() => setShowSyncHelp(false)}
                  className="flex items-center"
                >
                  <HelpCircle size={14} className="text-white/20 hover:text-white transition-colors cursor-help" />
                </button>
                <AnimatePresence>
                  {showSyncHelp && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-full mt-2 w-64 p-4 bg-white text-slate-900 text-[10px] font-bold rounded-2xl z-50 shadow-2xl leading-relaxed"
                    >
                      {t('help.sync')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('dashboard.productivity')}</span>
                   <span className="text-xl font-black">{weeklyConsistency[weeklyConsistency.length-1] || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyConsistency[weeklyConsistency.length-1] || 0}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                   />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('dashboard.wellnessIndex')}</span>
                   <span className="text-xl font-black text-emerald-400">{(profile?.energyScore || 0) * 10}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile?.energyScore || 0) * 10}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                   />
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                 "Your balance is <span className="text-emerald-400 font-black uppercase tracking-tighter">Optimized</span>. Productivity follows well-being."
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Module 1: Energy Score */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-6 lg:col-span-4 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm group relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Brain size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">{t('dashboard.dailyCalibration')}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl md:text-7xl font-black text-indigo-600 tracking-tighter">{profile?.energyScore || 0}</span>
              <span className="text-slate-300 font-bold block translate-y-[-10px]">/ 10</span>
            </div>
            <div className="mt-6 space-y-2">
              <h4 className="text-slate-900 font-black text-xl leading-tight">
                {latestCheckIn?.mode || t('dashboard.notCalibrated')}
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed italic">
                "{latestCheckIn?.quote || t('dashboard.calibrateAIPrompt')}"
              </p>
            </div>
          </div>
          <div className="mt-8 relative z-10">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(profile?.energyScore || 0) * 10}%` }}
                  className="bg-indigo-600 h-full rounded-full"
              />
            </div>
            {latestCheckIn && (
              <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { label: 'Energy', val: latestCheckIn.energy, color: 'emerald' },
                  { label: 'Focus', val: latestCheckIn.focus, color: 'blue' },
                  { label: 'Enthusiasm', val: latestCheckIn.enthusiasm, color: 'orange' }
                ].map(item => (
                  <div key={item.label} className="px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 shrink-0 min-w-[100px]">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{item.label}</p>
                    <p className="text-sm font-black text-slate-900">{item.val}/10</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Module 2: Adaptive Goal (Highlight) */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-6 lg:col-span-4 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[2.5rem] p-6 md:p-8 text-white flex flex-col justify-between shadow-2xl group relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Sparkles size={160} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Zap className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{t('dashboard.aiRecommendation')}</span>
            </div>
          </div>
          <div className="relative z-10 py-6 md:py-0">
            <h4 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">
                {latestCheckIn?.recommendations?.[0] || t('dashboard.waitCalibration')}
            </h4>
            <p className="text-sm text-indigo-100/80 mt-4 font-medium leading-relaxed">
                {latestCheckIn ? (profile?.language === 'id' ? "Berdasarkan analisisi Gemini, ini adalah prioritas utamamu untuk hasil maksimal." : "Based on Gemini analysis, this is your primary priority for maximum results.") : (profile?.language === 'id' ? "Lakukan kalibrasi pagi hari untuk mendapatkan sasaran yang disesuaikan dengan energimu." : "Perform morning calibration to get goals tailored to your energy.")}
            </p>
          </div>
          <button 
            onClick={() => navigate('/tasks')}
            className="w-full py-4 bg-white text-indigo-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:bg-indigo-50 relative z-10"
          >
            {t('dashboard.startTaskNow')}
          </button>
        </motion.div>

        {/* Module 3: Timeline */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('dashboard.optimizedTimeline')}</h3>
            <span className="text-[10px] font-bold bg-slate-50 px-3 py-1 rounded-full text-slate-600">
                {tasks.length} {t('dashboard.pending')}
            </span>
          </div>
          <div className="space-y-4">
            {tasks.length > 0 ? tasks.map((task, idx) => (
              <div key={task.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className={cn(
                      "flex-1 p-4 rounded-2xl transition-all border border-transparent hover:border-slate-100",
                      idx === 0 ? "bg-indigo-50 text-indigo-900" : "bg-slate-50 text-slate-700"
                  )}>
                      <h4 className="text-sm font-bold truncate">{task.title}</h4>
                      <p className="text-[10px] font-black uppercase opacity-60 mt-1">{task.category} • {task.duration}m</p>
                  </div>
              </div>
            )) : (
              <div className="text-center py-10">
                  <CheckSquare className="mx-auto h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase">{t('dashboard.allDone')}</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/tasks')} className="mt-auto pt-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">
            {t('dashboard.viewFullTimeline')} →
          </button>
        </motion.div>

        {/* Module 4: Weekly Consistency */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-8 bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('dashboard.weeklyConsistency')}</h3>
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
              <div className="h-3 w-3 rounded-full bg-slate-100"></div>
            </div>
          </div>
          <div className="flex items-end justify-between h-40 px-2 gap-3">
            {weeklyConsistency.map((h, i) => (
                <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(10, h)}%` }}
                        className={cn(
                            "w-full rounded-t-2xl transition-all duration-500",
                            h > 70 ? "bg-emerald-500" : h > 0 ? "bg-indigo-600" : "bg-slate-100"
                        )} 
                    />
                    <div className="mt-4 text-[9px] font-black text-slate-300 text-center uppercase">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </div>
                </div>
            ))}
          </div>
        </motion.div>

        {/* Module 5: Wellness Status */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-4 bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white flex flex-col items-center justify-center text-center border border-white/5"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-emerald-500">
            <Zap className="w-8 h-8" />
          </div>
          <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">{t('dashboard.statusOptimized')}</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-bold">
            {t('dashboard.restPatternStable')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
