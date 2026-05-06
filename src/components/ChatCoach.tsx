import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { geminiService } from '../services/geminiService';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatCoach() {
  const { profile } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'coach' | 'user', content: string }[]>([
    { role: 'coach', content: `Halo ${profile?.displayName}! Ada yang bisa aku bantu hari ini terkait produktivitas atau kesehatanmu?` }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      profile,
      currentEnergy: profile?.energyScore,
      vibe: profile?.vibeMode
    };

    const response = await geminiService.chatWithCoach(userMsg, context);
    setMessages(prev => [...prev, { role: 'coach', content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 flex h-[500px] w-80 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between bg-[var(--primary)] p-4 text-white">
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
                    ? 'bg-[var(--primary)] text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl p-3 animate-pulse">...</div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Tanya Coach..."
                className="flex-1 bg-slate-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button 
                onClick={handleSend}
                className="bg-[var(--primary)] text-white p-2 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
