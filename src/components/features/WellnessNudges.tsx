import { useEffect, useState } from 'react';
import { useApp } from '../../App';
import { geminiService } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles } from 'lucide-react';

export default function WellnessNudges() {
  const { profile, dashboardData } = useApp();
  const [show, setShow] = useState(false);
  const [nudge, setNudge] = useState<string>('');

  useEffect(() => {
    // Determine interval based on preference
    const frequency = profile?.settings?.aiPreferences?.nudgeFrequency || 'normal';
    const interval = frequency === 'high' ? 60000 : frequency === 'low' ? 300000 : 120000;

    const timer = setTimeout(async () => {
      if (!profile) return;
      
      const currentEnergy = dashboardData?.todayCheckin?.energyScore ?? dashboardData?.energyScore ?? profile.energyScore ?? 5;
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'pagi' : hour < 17 ? 'siang' : 'sore';
      const prompt = `Generate micro-wellness activity (2-3 menit) untuk user:
      Mood: ${currentEnergy < 5 ? 'Stres/Lelah' : 'Fokus/Energik'}
      Time: ${timeOfDay}
      Persona: ${profile?.settings?.aiPreferences?.coachTone || 'balanced'}
      Berikan 1 kalimat instruksi singkat dan 1 kalimat alasan. Bahasa Indonesia.`;
      
      const context = {
        energyScore: currentEnergy,
        completedTasks: dashboardData?.completedTasks || 0,
        totalTasks: dashboardData?.totalTasks || 0,
        mood: dashboardData?.todayCheckin?.mood || 'Belum check-in',
        streak: dashboardData?.streak || profile.streak || 0,
        userName: profile.displayName || 'User'
      };

      const res = await geminiService.chatWithCoach(prompt, context);
      setNudge(res);
      setShow(true);
    }, interval); 

    return () => clearTimeout(timer);
  }, [profile, dashboardData]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-10 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md bg-[var(--surface)] text-[var(--text)] rounded-2xl shadow-2xl border border-[var(--border)] p-6 select-none"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-[var(--accent)]">
                <Bell className="h-5 w-5 animate-bounce" />
                <span className="font-bold uppercase tracking-widest text-xs">Wellness Nudge</span>
            </div>
            <button onClick={() => setShow(false)} className="hover:bg-[var(--surface2)] p-1 rounded-xl"><X className="h-5 w-5 text-[var(--text3)]" /></button>
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--accent-bg)] flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <p className="text-sm leading-relaxed font-medium">
                {nudge ? nudge.replace(/\*\*/g, '') : 'Waktunya istirahat sejenak! Tarik napas dalam dan regangkan bahumu.'}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
             <button 
                onClick={() => setShow(false)}
                className="flex-1 bg-[var(--accent)] text-white py-2 rounded-xl text-sm font-bold"
             >
                Lakukan Sekarang
             </button>
             <button 
                onClick={() => setShow(false)}
                className="flex-1 bg-[var(--surface2)] text-[var(--text2)] py-2 rounded-xl text-sm font-bold"
             >
                Nanti saja
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
