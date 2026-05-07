import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Journal } from '../types';
import { BookOpen, Send, Star, Loader2, Sparkles, MessageSquareQuote, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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
    <div className="space-y-6 md:space-y-10">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Self-Reflection</h1>
        <p className="text-xs md:text-sm font-bold text-slate-400 md:text-slate-500 uppercase tracking-widest">Connect your thoughts, find your patterns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {aiResponse ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-600 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <MessageSquareQuote className="absolute top-8 right-8 h-16 w-16 opacity-10" />
                        <div className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-200 bg-white/10 px-4 py-1.5 rounded-full uppercase mb-8 border border-white/10 backdrop-blur-md">
                          <Sparkles size={12} /> Coach Insight
                        </div>
                        <p className="text-white text-lg md:text-xl leading-relaxed italic mb-10 relative z-10 font-bold">"{aiResponse}"</p>
                        <button 
                            onClick={() => setAiResponse(null)}
                            className="bg-white text-indigo-600 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-indigo-50 shadow-xl"
                        >
                            Log Another Entry
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Daily Vibe</h3>
                            <div className="flex gap-4 md:gap-3 justify-center">
                                {['😔', '😐', '😊', '🤩', '🔥'].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setMood(m)}
                                        className={`text-3xl md:text-2xl transition-all ${mood === m ? 'scale-125 grayscale-0' : 'grayscale opacity-30 hover:opacity-100'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Satisfaction Rating</label>
                            <div className="flex gap-3">
                                {[1,2,3,4,5].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setRating(s)}
                                        className={`flex-1 h-12 md:h-10 rounded-2xl flex items-center justify-center transition-all ${
                                            rating >= s ? 'bg-amber-400 text-white shadow-xl shadow-amber-100' : 'bg-slate-50 text-slate-200'
                                        }`}
                                    >
                                        <Star className={cn("h-5 w-5", rating >= s ? "fill-current" : "")} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peak Moment</label>
                                <textarea 
                                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] p-6 text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none h-32 resize-none transition-all placeholder:text-slate-300"
                                    placeholder="What was the highlight of your day?"
                                    value={highlight}
                                    onChange={e => setHighlight(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">The Hurdle</label>
                                <textarea 
                                    className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] p-6 text-sm font-bold focus:bg-white focus:border-indigo-600 outline-none h-32 resize-none transition-all placeholder:text-slate-300"
                                    placeholder="What stood in your way?"
                                    value={challenge}
                                    onChange={e => setChallenge(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !highlight}
                            className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-indigo-100 hover:bg-slate-900 hover:translate-y-[-2px] active:translate-y-[0] transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                            Process Reflections
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="space-y-8">
            <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest ml-4">Reflection Archive</h3>
            <div className="space-y-4">
                {history.map((j, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={j.id} 
                        className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex gap-6 group hover:border-indigo-600/30 transition-all"
                    >
                        <div className="text-4xl shrink-0 h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm">
                            {j.mood}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-black text-slate-800 truncate text-base">{j.highlight}</h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 ml-4">
                                    {new Date(j.createdAt as any).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold line-clamp-2 italic leading-relaxed">"{j.aiResponse}"</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
