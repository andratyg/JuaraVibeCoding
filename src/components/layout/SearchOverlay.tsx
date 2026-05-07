import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search as SearchIcon, X, ArrowRight, Zap, Target, Brain, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query as queryData } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useApp } from '../../App';
import { cn } from '../../lib/utils';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [dynamicResults, setDynamicResults] = useState<any[]>([]);
  const { profile } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setDynamicResults([]);
      return;
    }

    const searchData = async () => {
      if (!profile) return;
      const results: any[] = [];
      
      // Search Tasks
      const qTasks = queryData(collection(db, `users/${profile.id}/tasks`));
      const snapTasks = await getDocs(qTasks);
      snapTasks.docs.forEach(doc => {
        const d = doc.data();
        if (d.title.toLowerCase().includes(query.toLowerCase())) {
          results.push({ title: d.title, category: 'Task', icon: <Target size={14} />, path: '/tasks' });
        }
      });

      // Search Journal
      const qJournal = queryData(collection(db, `users/${profile.id}/journals`));
      const snapJournal = await getDocs(qJournal);
      snapJournal.docs.forEach(doc => {
        const d = doc.data();
        const searchText = `${d.highlight || ''} ${d.challenge || ''}`.toLowerCase();
        if (searchText.includes(query.toLowerCase())) {
          results.push({ title: (d.highlight || d.challenge || '').substring(0, 30) + '...', category: 'Journal', icon: <Brain size={14} />, path: '/journal' });
        }
      });

      setDynamicResults(results);
    };

    const timeoutId = setTimeout(searchData, 300);
    return () => clearTimeout(timeoutId);
  }, [query, profile]);

  const staticResults = [
    { title: 'Weekly Energy Trend', category: 'Analytics', icon: <Zap size={14} />, path: '/analytics' },
    { title: 'Fitness Coach Dashboard', category: 'Fitness', icon: <Activity size={14} />, path: '/fitness' },
  ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

  const allResults = [...staticResults, ...dynamicResults];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10"
          >
            <div className="p-5 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
              <SearchIcon size={20} className="text-slate-300 ml-2" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search protocols, tasks, or insights..."
                className="flex-1 bg-transparent border-none text-slate-900 text-lg placeholder:text-slate-300 focus:ring-0 font-bold"
              />
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-xl text-slate-300 hover:text-slate-900 transition-all shadow-sm bg-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-white">
              <div className="mb-4 px-3 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Recommendations</span>
                {query && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{allResults.length} Result{allResults.length !== 1 ? 's' : ''}</span>}
              </div>
              
              <div className="space-y-1">
                {allResults.length > 0 ? (
                  allResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(res.path);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-slate-50 group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all border border-slate-100 shadow-sm">
                          {res.icon}
                        </div>
                        <div className="text-left px-1">
                          <h4 className="text-slate-900 font-black text-sm tracking-tight">{res.title}</h4>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">{res.category}</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all bg-indigo-600 rounded-full p-2 text-white shadow-lg -translate-x-2 group-hover:translate-x-0">
                         <ArrowRight size={14} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                       <SearchIcon className="text-slate-200" size={24} />
                    </div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">No protocols initialized</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2"><kbd className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-400 shadow-sm">ESC</kbd> CLOSE</span>
                <span className="flex items-center gap-2"><kbd className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-400 shadow-sm">↵</kbd> EXECUTE</span>
              </div>
              <span className="flex items-center gap-2">Protocol Search <Zap size={10} className="text-indigo-600 fill-indigo-600" /></span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
