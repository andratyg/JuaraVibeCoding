import { useEffect, useState } from 'react';
import { useApp } from '../App';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles } from 'lucide-react';

export default function WellnessNudges() {
  const { profile } = useApp();
  const [show, setShow] = useState(false);
  const [nudge, setNudge] = useState<string>('');

  useEffect(() => {
    // Check every 90 minutes (5400000 ms)
    // For demo, we'll trigger after 2 minutes of being active
    const timer = setTimeout(async () => {
      if (!profile) return;
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'pagi' : hour < 17 ? 'siang' : 'sore';
      const prompt = `Generate micro-wellness activity (2-3 menit) untuk user:
      Mood: ${profile.energyScore < 5 ? 'Stres/Lelah' : 'Fokus/Energik'}
      Time: ${timeOfDay}
      Berikan 1 kalimat instruksi singkat dan 1 kalimat alasan. Bahasa Indonesia.`;
      
      // We'll reuse chatWithCoach for simplicity or a direct call
      const res = await geminiService.chatWithCoach(prompt, { profile });
      setNudge(res);
      setShow(true);
    }, 120000); 

    return () => clearTimeout(timer);
  }, [profile]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-10 left-1/2 z-[60] w-full max-w-md bg-white rounded-2xl shadow-2xl border-4 border-[var(--primary)] p-6 select-none"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-[var(--primary)]">
                <Bell className="h-5 w-5 animate-bounce" />
                <span className="font-bold uppercase tracking-widest text-xs">Wellness Nudge</span>
            </div>
            <button onClick={() => setShow(false)}><X className="h-5 w-5 text-slate-400" /></button>
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {nudge ? nudge.replace(/\*\*/g, '') : 'Waktunya istirahat sejenak! Tarik napas dalam dan regangkan bahumu.'}
            </p>
          </div>
          <div className="mt-6 flex gap-3">
             <button 
                onClick={() => setShow(false)}
                className="flex-1 bg-[var(--primary)] text-white py-2 rounded-xl text-sm font-bold"
             >
                Lakukan Sekarang
             </button>
             <button 
                onClick={() => setShow(false)}
                className="flex-1 bg-slate-100 text-slate-400 py-2 rounded-xl text-sm font-bold"
             >
                Nanti saja
             </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
