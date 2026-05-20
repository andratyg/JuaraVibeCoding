import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ChevronDown, Heart } from 'lucide-react'
import { geminiService } from '../services/geminiService'

interface Props {
  recentCheckins: any[]
  onDismiss?: () => void
}

const BurnoutAlert = ({ recentCheckins, onDismiss }: Props) => {
  const [plan, setPlan]       = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [showFull, setShowFull] = useState(false)

  useEffect(() => {
    if (!recentCheckins || recentCheckins.length === 0) return
    // Cek apakah sudah dismiss hari ini
    const lastDismiss = localStorage.getItem('burnout_dismiss')
    const today = new Date().toISOString().split('T')[0]
    if (lastDismiss === today) return
    
    // Cek rata-rata checkin terbaru
    const latest = recentCheckins.slice(0,3).map(c => c.energi || c.energyScore || 5)
    const avg = latest.reduce((a, b) => a + b, 0) / latest.length
    if (avg > 5) return // Muncul jika energi <= 5

    geminiService.checkBurnoutRisk(recentCheckins)
      .then(r => { 
        if (r.riskLevel !== 'low') {
          setPlan(r)
          setVisible(true)
        } 
      })
      .catch(console.error)
  }, [recentCheckins])

  const dismiss = () => {
    localStorage.setItem('burnout_dismiss', new Date().toISOString().split('T')[0])
    setVisible(false)
    onDismiss?.()
  }

  if (!visible || !plan) return null
  const isHigh = ['high', 'critical'].includes(plan.riskLevel)
  const mc = isHigh ? 'var(--error)' : 'var(--warning)'

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-full max-w-md rounded-[var(--r-2xl)] overflow-hidden border"
          style={{ background: 'var(--surface2)', borderColor: `${mc}44` }}
          initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
          exit={{ y: 60, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
          
          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3 border-b"
            style={{ background: `${mc}10`, borderColor: `${mc}20` }}>
            <div className="w-10 h-10 rounded-[var(--r-lg)] flex items-center justify-center" style={{ background: `${mc}18` }}>
              <AlertTriangle size={20} style={{ color: mc }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Peringatan Burnout Terdeteksi</h3>
              <p className="text-xs font-medium" style={{ color: mc }}>Risiko {plan.riskLevel?.toUpperCase()} — Skor {plan.riskScore}/100</p>
            </div>
            <button onClick={dismiss} className="w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] hover:bg-white/10">
              <X size={16} style={{ color: 'var(--text3)' }} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>{plan.message}</p>
            
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>Lakukan sekarang:</p>
            {plan.recoveryPlan?.today?.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2, fontSize: 12 }}>→</span>
                <span className="text-sm" style={{ color: 'var(--text2)' }}>{s}</span>
              </div>
            ))}

            <button onClick={() => setShowFull(!showFull)}
              className="flex items-center gap-1.5 text-xs my-3" style={{ color: 'var(--text3)' }}>
              <ChevronDown size={14} className={showFull ? 'rotate-180' : ''} />
              {showFull ? 'Sembunyikan' : 'Lihat rencana lengkap'}
            </button>

            <AnimatePresence>
              {showFull && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mb-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    {plan.recoveryPlan?.thisWeek?.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <span style={{ color: 'var(--accent-text)', flexShrink: 0, fontSize: 12 }}>{i + 1}.</span>
                        <span className="text-sm" style={{ color: 'var(--text2)' }}>{s}</span>
                      </div>
                    ))}
                    {plan.shouldSeeHelp && (
                      <div className="mt-3 p-3 rounded-[var(--r-lg)] flex items-start gap-2"
                        style={{ background: 'rgba(29,185,122,0.08)', border: '1px solid rgba(29,185,122,0.2)' }}>
                        <Heart size={14} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                        <p className="text-xs" style={{ color: 'rgba(29,185,122,0.9)' }}>
                          Berbicara dengan profesional atau orang terpercaya bisa sangat membantu pemulihanmu.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button onClick={dismiss}
                className="flex-1 py-2.5 text-sm rounded-[var(--r-md)] border"
                style={{ background: 'var(--surface)', color: 'var(--text2)', borderColor: 'var(--border)' }}>
                Nanti dulu
              </button>
              <button onClick={dismiss}
                className="flex-1 py-2.5 text-sm font-medium rounded-[var(--r-md)] text-white"
                style={{ background: 'var(--accent)' }}>
                Saya akan jaga diri ✓
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BurnoutAlert
