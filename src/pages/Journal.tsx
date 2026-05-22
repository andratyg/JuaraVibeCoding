import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { Journal } from '../types/index';
import { BookOpen, Send, Star, Loader2, Sparkles, MessageSquareQuote, Zap, Tag, HelpCircle, Heart, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeInUp, itemFadeIn, stagger } from '../utils/animations';
import { formatDateLong } from '../utils/formatters';
import { saveJournal } from '../utils/firestoreHelpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonPage } from '../components/ui/Skeletons';
import toast from 'react-hot-toast';

export default function JournalPage() {
  const { t } = useTranslation();
  const { profile } = useApp();
  const [rating, setRating] = useState(3);
  const [highlight, setHighlight] = useState('');
  const [challenge, setChallenge] = useState('');
  const [mood, setMood] = useState('😊');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [history, setHistory] = useState<Journal[]>([]);

  const fetchHistory = async () => {
    if (!profile?.id) return;
    try {
      const q = query(collection(db, `users/${profile.id}/journals`), orderBy('createdAt', 'desc'), limit(5));
      const snapshot = await getDocs(q).catch(e => {
        if (e.message?.includes('offline')) {
          console.warn('Journal history fetch: client is offline');
          return { docs: [] } as any;
        }
        throw e;
      });
      setHistory(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Journal;
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${profile.id}/journals`);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [profile?.id]);

  const [isCooldown, setIsCooldown] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!highlight || !profile?.id) return;
    
    // Validation
    if (highlight.length > 5000 || challenge.length > 5000) {
      toast.error('Teks terlalu panjang. Maksimal 5.000 karakter.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { checkRateLimit } = await import('../utils/rateLimit');
      const { remaining } = await checkRateLimit(profile.id);
      setRemainingQuota(remaining);

      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `gemini_journal_${today}`;
      const toastId = toast.loading('⏳ Velora sedang menganalisis...');

      // Sanitization
      const sanitize = (text: string) => text.replace(/<[^>]*>?/gm, '');

      const entry = {
        rating,
        highlight: sanitize(highlight),
        challenge: sanitize(challenge),
        mood,
        freeWrite: ''
      };
      
      const analysis = await geminiService.generateJournalResponse(entry);
      
      await saveJournal(profile.id, entry, analysis);

      localStorage.setItem(cacheKey, JSON.stringify({
        data: analysis,
        expiry: Date.now() + 24 * 60 * 60 * 1000
      }));

      setAiResponse(analysis);
      toast.success(t('journal.success'), { id: toastId });
      setHighlight('');
      setChallenge('');
      fetchHistory();

      // Cooldown 3 detik
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 3000);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `users/${profile.id}/journals`);
      toast.error(error.message || 'Error occurred', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <SkeletonPage />;

  return (
    <motion.div {...fadeInUp} className="space-y-6 md:space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('journal.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>{t('journal.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 items-start">
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {aiResponse ? (
                    <motion.div 
                        key="response"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="p-8 space-y-8 relative overflow-hidden group border-none bg-indigo-600 text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
                            <Sparkles size={12} /> {t('journal.coachInsight')}
                          </div>
                          <MessageSquareQuote className="opacity-20" size={32} />
                        </div>
                        
                        <div className="space-y-8 relative z-10">
                          <p className="text-xl md:text-2xl font-bold leading-relaxed italic">
                            "{aiResponse.response}"
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {aiResponse.emotionTags?.map((tag: string) => (
                              <span key={tag} className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                # {tag}
                              </span>
                            ))}
                          </div>

                          <div className="p-6 bg-black/10 rounded-3xl border border-white/10">
                            <div className="flex items-center gap-2 mb-3 opacity-60">
                              <HelpCircle size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">{t('journal.reflectionQuestion')}</span>
                            </div>
                            <p className="text-base font-medium leading-relaxed">{aiResponse.reflectionQuestion}</p>
                          </div>

                          <div className="flex items-center gap-3 text-white/80">
                            <Heart size={20} className="fill-current text-rose-300" />
                            <p className="text-xs font-bold uppercase tracking-widest">{aiResponse.affirmation}</p>
                          </div>
                        </div>

                        <Button 
                            variant="primary"
                            fullWidth
                            className="bg-white text-indigo-600 hover:bg-white/90"
                            onClick={() => setAiResponse(null)}
                        >
                            {t('journal.logAnother')}
                        </Button>
                      </Card>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                      <Card className="p-8 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <h3 className="font-bold text-lg">{t('journal.dailyVibe')}</h3>
                            <div className="flex gap-2">
                                {['😔', '😐', '😊', '🤩', '🔥'].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setMood(m)}
                                        className={`text-3xl p-2 rounded-xl transition-all ${mood === m ? 'bg-[var(--surface2)] scale-110 shadow-sm' : 'grayscale opacity-50 hover:opacity-100 hover:bg-[var(--surface)]'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{t('journal.satisfactionRating')}</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setRating(s)}
                                        className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${
                                            rating >= s ? 'bg-amber-400 text-white shadow-md' : 'bg-[var(--surface)] text-[var(--text3)] hover:bg-[var(--surface2)]'
                                        }`}
                                    >
                                        <Star size={20} className={rating >= s ? "fill-current" : ""} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{t('journal.peakMoment')}</label>
                                <textarea 
                                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-sm md:text-base font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-32 resize-none transition-all placeholder:opacity-30"
                                    placeholder={t('journal.peakPlaceholder')}
                                    value={highlight}
                                    onChange={e => setHighlight(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{t('journal.hurdle')}</label>
                                <textarea 
                                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-sm md:text-base font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-32 resize-none transition-all placeholder:opacity-30"
                                    placeholder={t('journal.hurdlePlaceholder')}
                                    value={challenge}
                                    onChange={e => setChallenge(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button 
                            fullWidth
                            loading={loading}
                            onClick={handleSubmit}
                            disabled={!highlight || isCooldown}
                            icon={Sparkles}
                        >
                            {t('journal.process')}
                        </Button>
                        {remainingQuota !== null && (
                            <p className="text-center text-xs opacity-50 font-medium pb-2">Analisis tersisa hari ini: {remainingQuota}</p>
                        )}
                      </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="space-y-6">
            <h3 className="font-bold text-xs uppercase tracking-widest opacity-50 ml-2">{t('journal.archive')}</h3>
            <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <BookOpen size={40} className="mx-auto mb-2" />
                    <p className="text-xs font-medium">Belum ada catatan refleksi</p>
                  </div>
                ) : history.map((j, i) => (
                    <motion.div 
                        {...itemFadeIn}
                        key={j.id} 
                    >
                      <Card className="p-5 flex gap-5 hover:border-[var(--accent)] transition-all cursor-pointer group">
                        <div className="text-3xl shrink-0 h-16 w-16 bg-[var(--surface)] rounded-2xl flex items-center justify-center border border-[var(--border)] group-hover:bg-[var(--surface2)]">
                            {j.mood}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-sm truncate group-hover:text-[var(--accent)] transition-colors">{j.highlight}</h4>
                                <span className="text-[10px] font-medium opacity-40 shrink-0 flex items-center gap-1">
                                    <Calendar size={10} /> {formatDateLong(j.createdAt)}
                                </span>
                            </div>
                            <p className="text-xs opacity-60 line-clamp-2 italic leading-relaxed">
                              "{typeof j.aiResponse === 'string' ? j.aiResponse : (j.aiResponse as any)?.response || 'Refleksi diproses.'}"
                            </p>
                        </div>
                      </Card>
                    </motion.div>
                ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
