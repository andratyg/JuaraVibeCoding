import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface BurnoutAlertProps {
  recentCheckins: any[];
  onDismiss?: () => void;
}

const BurnoutAlert = ({ recentCheckins, onDismiss }: BurnoutAlertProps) => {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!recentCheckins || recentCheckins.length < 3) return;
    const last3Energi = recentCheckins.slice(0, 3).map(c => c.energi || c.energyScore || 5);
    const avg = last3Energi.reduce((a, b) => a + b, 0) / 3;
    if (avg >= 4) return; // don't trigger if average is still okay
    
    setLoading(true);
    geminiService.checkBurnoutRisk(recentCheckins)
      .then(result => {
        if (result.riskLevel !== 'low') {
          setPlan(result);
          setVisible(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [recentCheckins]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const riskColors: any = {
    medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/15' },
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500/15' },
    critical: { bg: 'bg-red-600/15', border: 'border-red-600/40', text: 'text-red-300', badge: 'bg-red-600/20' }
  };
  const colors = plan ? (riskColors[plan.riskLevel] || riskColors.medium) : riskColors.medium;

  if (loading) return null;

  return (
    <AnimatePresence>
      {visible && plan && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full max-w-md bg-[#13161D] ${colors.border} border rounded-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className={`${colors.bg} px-5 py-4 flex items-center gap-3 border-b ${colors.border}`}>
              <div className={`w-10 h-10 rounded-xl ${colors.badge} flex items-center justify-center flex-shrink-0`}>
                <AlertTriangle size={20} className={colors.text} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">Peringatan Burnout Terdeteksi</h3>
                <p className={`${colors.text} text-xs font-medium`}>
                  Risiko {plan.riskLevel.toUpperCase()} — Skor {plan.riskScore}/100
                </p>
              </div>
              <button onClick={handleDismiss} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-white/75 text-sm leading-relaxed mb-4">{plan.message}</p>

              {/* Warning signals */}
              {plan.warningSignals?.length > 0 && (
                <div className="mb-4 p-3 bg-white/5 rounded-xl">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Yang terdeteksi:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.warningSignals.map((s: string, i: number) => (
                      <span key={i} className={`text-[11px] px-2 py-0.5 ${colors.badge} ${colors.text} rounded-full`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's steps */}
              <div className="mb-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Lakukan sekarang:</p>
                <div className="space-y-1.5">
                  {plan.recoveryPlan.today.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5 text-xs flex-shrink-0">→</span>
                      <span className="text-sm text-white/80">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full plan toggle */}
              <button
                onClick={() => setShowFull(!showFull)}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors mb-4"
              >
                {showFull ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showFull ? 'Sembunyikan rencana lengkap' : 'Lihat rencana pemulihan lengkap'}
              </button>

              <AnimatePresence>
                {showFull && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Rencana minggu ini:</p>
                        {plan.recoveryPlan.thisWeek?.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="text-blue-400 text-xs mt-0.5 flex-shrink-0">{i+1}.</span>
                            <span className="text-sm text-white/70">{step}</span>
                          </div>
                        ))}
                      </div>
                      {plan.shouldSeeHelp && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2">
                          <Heart size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-300/90">Mempertimbangkan untuk berbicara dengan profesional atau orang terpercaya bisa sangat membantu pemulihan kamu.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/8 text-white/60 text-sm rounded-xl transition-colors border border-white/10"
                >
                  Nanti dulu
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 bg-[#6C63FF] hover:bg-[#5A52E8] text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Saya akan jaga diri ✓
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BurnoutAlert;
