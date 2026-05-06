import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Journal } from '../types';
import { BookOpen, Send, Star, Loader2, Sparkles, MessageSquareQuote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function JournalPage() {
  const { profile } = useApp();
  const [rating, setRating] = useState(3);
  const [highlight, setHighlight] = useState('');
  const [challenge, setChallenge] = useState('');
  const [mood, setMood] = useState('😊');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<Journal[]>([]);

  const fetchHistory = async () => {
    if (!profile) return;
    const q = query(collection(db, `users/${profile.id}/journals`), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal)));
  };

  useEffect(() => { fetchHistory(); }, [profile]);

  const handleSubmit = async () => {
    if (!highlight || !profile) return;
    setLoading(true);
    
    const fullText = `Highlight: ${highlight}\nChallenge: ${challenge}\nMood: ${mood}`;
    const response = await geminiService.generateJournalResponse(fullText);
    
    const journalData = {
      rating,
      highlight,
      challenge,
      mood,
      aiResponse: response,
      createdAt: new Date(),
    };

    await addDoc(collection(db, `users/${profile.id}/journals`), journalData);
    setAiResponse(response);
    setLoading(false);
    fetchHistory();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Self-Reflection</h1>
        <p className="text-slate-500">Curahkan pikiranmu, AI Coach akan membantu menemukan polanya.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {aiResponse ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[var(--primary)] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden"
                    >
                        <MessageSquareQuote className="absolute top-4 right-4 h-12 w-12 opacity-10" />
                        <h3 className="font-bold text-xl mb-4">Coach Insight</h3>
                        <p className="text-white/90 leading-relaxed italic mb-6">"{aiResponse}"</p>
                        <button 
                            onClick={() => setAiResponse(null)}
                            className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                            Tulis Lagi
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Bagaimana harimu?</h3>
                            <div className="flex gap-2 text-2xl">
                                {['😔', '😐', '😊', '🤩', '🔥'].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setMood(m)}
                                        className={`transition-transform ${mood === m ? 'scale-125 grayscale-0' : 'grayscale opacity-50 hover:opacity-100'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase mb-2 block">Rating Hari Ini</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setRating(s)}
                                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                            rating >= s ? 'bg-amber-400 text-white shadow-lg shadow-amber-100' : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <Star className="h-5 w-5 fill-current" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase">Momen Terbaik</label>
                                <textarea 
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[var(--primary)] h-24 resize-none"
                                    placeholder="Apa satu hal baik yang terjadi hari ini?"
                                    value={highlight}
                                    onChange={e => setHighlight(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-400 uppercase">Tantangan</label>
                                <textarea 
                                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[var(--primary)] h-24 resize-none"
                                    placeholder="Apa rintangan yang kamu hadapi?"
                                    value={challenge}
                                    onChange={e => setChallenge(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !highlight}
                            className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-[var(--primary-light)] hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                            Kirim ke Coach
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="space-y-6">
            <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest">Entry Terakhir</h3>
            <div className="space-y-4">
                {history.map((j, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={j.id} 
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4"
                    >
                        <div className="text-3xl">{j.mood}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 truncate">{j.highlight}</h4>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(j.createdAt as any).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 italic">"{j.aiResponse}"</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
