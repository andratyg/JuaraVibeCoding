import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { geminiService } from '../services/geminiService';
import { FileText, Copy, Check, Loader2, Zap, LayoutList, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Summarizer() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showSummarizerHelp, setShowSummarizerHelp] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await geminiService.summarizeDocument(text);
    setResult(res);
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Document Summarizer</h1>
          <div className="relative">
            <button 
              onClick={() => setShowSummarizerHelp(!showSummarizerHelp)}
              onMouseEnter={() => setShowSummarizerHelp(true)}
              onMouseLeave={() => setShowSummarizerHelp(false)}
              className="flex items-center"
            >
              <HelpCircle size={20} className="text-slate-300 cursor-help" />
            </button>
            <AnimatePresence>
              {showSummarizerHelp && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 top-full mt-2 w-72 p-4 bg-slate-900 text-white text-[10px] font-bold rounded-2xl z-50 shadow-2xl leading-relaxed border border-white/5"
                >
                  {t('help.summarizer')}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <p className="text-xs md:text-sm font-bold text-slate-400 md:text-slate-500 uppercase tracking-widest">Condense complex data with AI-driven intelligence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 overflow-hidden">
            <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest px-2">Input Reservoir</h3>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste long emails, reports, or articles here..."
              className="w-full h-80 bg-slate-50 border-2 border-transparent rounded-[1.5rem] p-6 text-sm font-bold focus:bg-white focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 resize-none"
            />
            <button
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="w-full mt-6 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
              Generate Intelligence
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"
              >
                <Zap className="h-12 w-12 mb-4 opacity-10" />
                <p>Hasil ringkasan akan muncul di sini.</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Summary Box */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-slate-50 rounded-full -mr-20 -mt-20 blur-3xl opacity-50"></div>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Executive Summary</h3>
                    <button onClick={handleCopy} className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm">
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-sm font-bold mb-10 relative z-10 italic">
                    "{result.summary}"
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                     <div className="p-6 bg-slate-900 rounded-3xl border border-white/10 shadow-lg">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Efficiency Gain</div>
                        <div className="text-2xl font-black text-white">{result.timeSaved}m <span className="text-xs text-slate-500 font-bold ml-1 uppercase">Saved</span></div>
                     </div>
                     <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Confidence</div>
                        <div className="text-2xl font-black text-slate-900">98% <span className="text-xs text-slate-500 font-bold ml-1 uppercase">Precision</span></div>
                     </div>
                  </div>
                </div>

                {/* Key Points */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <h3 className="font-black text-slate-900 uppercase text-sm tracking-widest">Protocol Highlights</h3>
                  </div>
                  <ul className="space-y-4">
                    {result.keyPoints.map((point: string, i: number) => (
                      <li key={i} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-50 group hover:border-teal-200 transition-all font-bold text-sm text-slate-600">
                        <span className="text-teal-400 shrink-0 mt-1"><Zap size={14} fill="currentColor" /></span> {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden group">
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32 group-hover:scale-125 transition-transform duration-1000" />
                   <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="h-10 w-10 bg-white/10 text-emerald-400 rounded-xl flex items-center justify-center">
                        <CheckCircle size={20} />
                    </div>
                    <h3 className="font-black text-white uppercase text-sm tracking-widest">Active Commands</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 relative z-10">
                    {result.actionItems.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-slate-300 backdrop-blur-sm group/item hover:bg-white/10 transition-all">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0"></div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
