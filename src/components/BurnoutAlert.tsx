import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';

interface BurnoutAlertProps {
  userId: string;
}

export const BurnoutAlert = ({ userId }: BurnoutAlertProps) => {
  const [burnoutData, setBurnoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const checkBurnout = async () => {
      if (!userId) return;
      
      try {
        const recentCheckinsSnap = await getDocs(query(
          collection(db, `users/${userId}/energyCheckIns`),
          orderBy('createdAt', 'desc'),
          limit(7)
        ));
        
        const checkins = recentCheckinsSnap.docs.map(d => d.data());
        if (checkins.length >= 3) {
          const last3Scores = checkins.slice(0, 3).map(c => c.energyScore || c.score || 0);
          const avgScore = last3Scores.reduce((a, b) => a + b, 0) / 3;
          
          if (avgScore < 4) {
            const result = await geminiService.checkBurnoutRisk(checkins);
            setBurnoutData(result);
          }
        }
      } catch (err) {
        console.error('Burnout check error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkBurnout();
  }, [userId]);

  if (loading || !burnoutData || burnoutData.riskLevel === 'low' || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-[#1A1E28] border border-red-500/30 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl"></div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-tight">Burnout Alert</h3>
              <p className="text-red-400 text-xs font-black uppercase tracking-widest mt-1">
                Risk Level: {burnoutData.riskLevel}
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm mb-8 leading-relaxed font-medium">
            {burnoutData.message}
          </p>

          <div className="space-y-4 mb-8">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Immediate Recovery Steps:</p>
            <div className="space-y-3">
              {burnoutData.recoveryPlan?.immediate?.map((step: string, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex items-start gap-3 text-sm text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5"
                >
                  <div className="mt-1 bg-emerald-500/20 p-0.5 rounded-full">
                    <ChevronRight size={12} className="text-emerald-400" />
                  </div>
                  <span className="font-medium">{step}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
          >
            Acknowledge & Sync Plan
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
