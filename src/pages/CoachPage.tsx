import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { geminiService } from '../services/geminiService';
import { useDashboardData } from '../hooks/useDashboardData';
import { MessageCircle, Send, Bot, User, Sparkles, Brain, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeInUp, itemFadeIn } from '../utils/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function CoachPage() {
  const { profile } = useApp();
  const { data: dashboardData } = useDashboardData(profile?.id);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'coach' | 'user', content: string }[]>([
    { role: 'coach', content: `Halo ${profile?.displayName || 'Sobat Pulse'}! Saya AI Coach pribadimu. Hari ini energi skormu berada di angka ${profile?.energyScore || '?'}/10. Ada yang ingin kamu diskusikan atau perlu bantuan menjadwalkan hari?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    const context = {
      energyScore: dashboardData?.todayCheckin?.energyScore ?? dashboardData?.energyScore ?? profile?.energyScore ?? 'belum check-in',
      completedTasks: dashboardData?.completedTasks || 0,
      totalTasks: dashboardData?.totalTasks || 0,
      mood: dashboardData?.todayCheckin?.mood || 'Belum check-in',
      streak: dashboardData?.streak || profile?.streak || 0,
      userName: profile?.displayName || 'User'
    };

    try {
      const response = await geminiService.chatWithCoach(userMsg, context, messages);
      setMessages(prev => [...prev, { role: 'coach', content: response }]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { 
        role: 'coach', 
        content: `Maaf, terjadi gangguan koneksi. (${error.message || 'Unknown error'})` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div {...fadeInUp} className="h-[calc(100vh-140px)] flex flex-col space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Life Coach</h1>
          <p className="text-sm text-[var(--text2)]">Konsultasi produktivitas dan kesehatan berbasis energi.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-bg)] text-[var(--accent)] rounded-lg border border-[var(--accent)]/10 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles size={14} /> AI Aktif: Gemini 3.5 Flash
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="lg:col-span-8 flex flex-col overflow-hidden border-none shadow-xl bg-[var(--surface)]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
            {messages.map((m, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  m.role === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface2)] text-[var(--accent)] border border-[var(--border)]'
                }`}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[85%] md:max-w-[70%] space-y-1 ${m.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-[var(--accent)] text-white rounded-tr-none' 
                    : 'bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] rounded-tl-none shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--surface2)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
                  <Bot size={16} />
                </div>
                <div className="bg-[var(--surface2)] rounded-2xl p-4 border border-[var(--border)] shadow-sm">
                   <div className="flex gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                   </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 md:p-6 bg-[var(--surface2)] border-t border-[var(--border)]">
            <div className="relative flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Tanyakan sesuatu pada coach..."
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[var(--accent)] transition-all pr-12 shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--accent)] text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-[var(--text3)] uppercase tracking-widest font-bold">
                PULSE AI TIDAK MEMBERIKAN SARAN MEDIS; KONSULTASIKAN DENGAN AHLI PROFESIONAL JIKA PERLU.
            </p>
          </div>
        </Card>

        {/* Sidebar Info */}
        <aside className="lg:col-span-4 space-y-6 overflow-y-auto pr-1">
            <Card className="p-6 space-y-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Brain size={80} />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                        <Info size={14} /> Contextual Awareness
                    </div>
                    <div>
                        <h4 className="font-bold text-lg leading-tight">Analisis Real-time</h4>
                        <p className="text-xs text-indigo-100 mt-1">Coach telah mempertimbangkan skor energi dan beban tugasmu hari ini dalam setiap respons.</p>
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                <p className="text-[10px] font-black text-[var(--text3)] uppercase tracking-widest px-2">Topik Diskusi</p>
                <div className="grid grid-cols-1 gap-2">
                    <TopicCard icon={Brain} label="Manajemen Stress" />
                    <TopicCard icon={Sparkles} label="Optimasi Fokus" />
                    <TopicCard icon={MessageCircle} label="Refleksi Karir" />
                </div>
            </div>
        </aside>
      </div>
    </motion.div>
  );
}

function TopicCard({ icon: Icon, label }: any) {
    return (
        <button className="flex items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all group text-left">
            <div className="p-2 bg-[var(--surface2)] rounded-lg text-[var(--text2)] group-hover:text-[var(--accent)] transition-colors">
                <Icon size={16} />
            </div>
            <span className="text-xs font-bold text-[var(--text2)] group-hover:text-[var(--text)]">{label}</span>
        </button>
    )
}
