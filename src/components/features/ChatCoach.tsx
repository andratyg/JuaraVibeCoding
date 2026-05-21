import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../App';
import { geminiService } from '../../services/geminiService';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatCoach() {
  const { profile, dashboardData } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'coach' | 'user', content: string }[]>([
    { role: 'coach', content: `Halo ${profile?.displayName || 'Sobat'}! Ada yang bisa saya bantu hari ini terkait produktivitas atau kesejahteraanmu?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
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
        content: error.message || 'Maaf, aku sedang mengalami kendala teknis. Coba lagi nanti ya!' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl border border-[var(--border)]"
          >
            <div className="flex items-center justify-between bg-[var(--accent)] p-4 text-[var(--surface)]">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">AI Life Coach</span>
              </div>
              <button onClick={() => setIsOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    m.role === 'user' 
                    ? 'bg-[var(--accent)] text-[var(--surface)] rounded-tr-none' 
                    : 'bg-[var(--surface2)] text-[var(--text)] rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[var(--surface2)] rounded-2xl p-3 animate-pulse">...</div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Tanya Coach..."
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button 
                onClick={handleSend}
                className="bg-[var(--accent)] text-[var(--surface)] p-2 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--surface)] shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
