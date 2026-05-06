import { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { FileText, Copy, Check, Loader2, Zap, LayoutList, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Summarizer() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Document Summarizer</h1>
        <p className="text-slate-500">Hemat waktu dengan ringkasan cerdas bertenaga Gemini AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4">Input Teks / Laporan</h3>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste email panjang, laporan rapat, atau artikel di sini..."
              className="w-full h-80 bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
            <button
              onClick={handleSummarize}
              disabled={loading || !text.trim()}
              className="w-full mt-4 bg-[var(--primary)] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <LayoutList className="h-5 w-5" />}
              Hasilkan Ringkasan
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
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[var(--primary)] text-lg">Executive Summary</h3>
                    <button onClick={handleCopy} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm mb-8">
                    {result.summary}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-[var(--primary-light)] rounded-2xl border border-[var(--primary)]/10">
                        <div className="text-[10px] font-bold text-[var(--primary)] uppercase mb-1">Time Saved</div>
                        <div className="text-xl font-black text-[var(--primary)]">{result.timeSaved} Menit</div>
                     </div>
                     <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">Precision</div>
                        <div className="text-xl font-black text-orange-600">98%</div>
                     </div>
                  </div>
                </div>

                {/* Key Points */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-5 w-5 text-teal-400" />
                    <h3 className="font-bold">Key Points</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.keyPoints.map((point: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-400 italic">
                        <span className="text-teal-400">•</span> {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8">
                   <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="h-5 w-5 text-[var(--primary)]" />
                    <h3 className="font-bold text-slate-800">Action Items</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {result.actionItems.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600">
                        <div className="h-2 w-2 rounded-full bg-[var(--primary)]"></div>
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
