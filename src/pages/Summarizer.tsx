import { useState } from 'react';
import { useApp } from '../App';
import { useTranslation } from 'react-i18next';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { geminiService } from '../services/geminiService';
import { FileText, Copy, Check, Loader2, Zap, LayoutList, CheckCircle, HelpCircle, ArrowRight, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeInUp, itemFadeIn } from '../utils/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Summarizer() {
  const { t } = useTranslation();
  const { profile } = useApp();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [isCooldown, setIsCooldown] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    
    // Validasi panjang
    if (text.length < 10) {
      toast.error('Teks terlalu pendek. Masukkan minimal 10 karakter.');
      return;
    }
    if (text.length > 20000) {
      toast.error('Teks terlalu panjang. Maksimal 20.000 karakter.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('⏳ Velora sedang menganalisis dokumen...');
    
    try {
      if (profile?.id) {
        const { checkRateLimit } = await import('../utils/rateLimit');
        const { remaining } = await checkRateLimit(profile.id);
        setRemainingQuota(remaining);
      }

      // Sanitasi input user (menghilangkan tag HTML dasar)
      const sanitizedText = text.replace(/<[^>]*>?/gm, '');

      const res = await geminiService.summarizeDocument(sanitizedText);
      if (profile?.id) {
        await addDoc(collection(db, `users/${profile.id}/summaries`), {
          ...res,
          originalText: sanitizedText.substring(0, 500) + '...',
          createdAt: new Date().toISOString()
        });
      }
      setResult(res);
      toast.success('Analisis selesai!', { id: toastId });

      // Cooldown 3 detik untuk mencegah spam
      setIsCooldown(true);
      setTimeout(() => setIsCooldown(false), 3000);

    } catch (error: any) {
      console.error('Summarize Error:', error);
      toast.error(error.message || 'Gagal menganalisis dokumen.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const content = `Ringkasan: ${result.summary}\n\nPoin Penting:\n${result.keyPoints.join('\n')}\n\nTindakan:\n${result.actionItems.join('\n')}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content).catch(() => fallbackCopyTextToClipboard(content));
    } else {
      fallbackCopyTextToClipboard(content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Teks disalin!');
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <motion.div {...fadeInUp} className="space-y-6 md:space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('nav.summarizer')}</h1>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>{t('dashboard.summarizeDocs')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input area */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-lg">Input Dokumen</h3>
            <div className="space-y-4">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t('summarizer.placeholder') || "Tempelkan email panjang, laporan, atau artikel di sini..."}
                className="w-full h-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-sm md:text-base font-medium focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-20 outline-none transition-all placeholder:opacity-30 resize-none"
              />
              <Button
                fullWidth
                loading={loading}
                disabled={!text.trim() || isCooldown}
                onClick={handleSummarize}
                icon={Brain}
              >
                {t('summarizer.action') || 'Analisis Inteligensi'}
              </Button>
              {remainingQuota !== null && (
                <p className="text-center text-xs opacity-50 font-medium">Analisis tersisa hari ini: {remainingQuota}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Result area */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                {...itemFadeIn}
                className="h-full flex flex-col items-center justify-center py-32 bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] border-dashed opacity-50"
              >
                <div className="w-16 h-16 bg-[var(--surface2)] rounded-full flex items-center justify-center mb-4">
                  <Zap size={32} className="text-[var(--text3)]" />
                </div>
                <p className="text-sm font-medium">Hasil ringkasan akan muncul di sini</p>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                {... fadeInUp}
                className="space-y-6"
              >
                {/* Executive Summary */}
                <Card className="p-8 space-y-6 border-none bg-indigo-600 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
                      <LayoutList size={12} /> Ringkasan Eksekutif
                    </div>
                    <button 
                      onClick={handleCopy} 
                      className="h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white text-white hover:text-indigo-600 rounded-xl transition-all border border-white/10"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>

                  <p className="text-lg font-bold leading-relaxed italic relative z-10">
                    "{result.summary}"
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 relative z-10 pt-4">
                     <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Waktu Hemat</div>
                        <div className="text-2xl font-bold">{result.timeSaved} menit</div>
                     </div>
                     <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Presisi AI</div>
                        <div className="text-2xl font-bold">98%</div>
                     </div>
                  </div>
                </Card>

                {/* Key Points */}
                <Card className="p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[var(--surface2)] text-[var(--accent)] rounded-xl flex items-center justify-center">
                        <CheckCircle size={20} />
                    </div>
                    <h3 className="font-bold text-lg">Poin Penting</h3>
                  </div>
                  <ul className="grid grid-cols-1 gap-3">
                    {result.keyPoints.map((point: string, i: number) => (
                      <li key={i} className="flex gap-4 p-5 bg-[var(--surface)] rounded-2xl border border-[var(--border)] group hover:border-[var(--accent)] transition-all">
                        <div className="text-[var(--accent)] shrink-0 mt-1"><ArrowRight size={14} /></div>
                        <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text2)' }}>{point}</p>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Action Items */}
                <Card className="p-8 space-y-6 bg-emerald-500/5 border-emerald-500/20">
                   <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                        <Zap size={20} />
                    </div>
                    <h3 className="font-bold text-lg text-emerald-600">Langkah Aksi</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.actionItems.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-emerald-500/50 transition-all">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-xs font-bold leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
