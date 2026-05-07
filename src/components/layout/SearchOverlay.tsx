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
      const qJournal = queryData(collection(db, `users/${profile.id}/journal`));
      const snapJournal = await getDocs(qJournal);
      snapJournal.docs.forEach(doc => {
        const d = doc.data();
        if (d.content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ title: d.content.substring(0, 30) + '...', category: 'Journal', icon: <Brain size={14} />, path: '/journal' });
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
            className="fixed inset-0 bg-[#0D0F14]/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-[#13161C] border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-4 border-b border-white/5 flex items-center gap-4">
              <SearchIcon size={20} className="text-white/20 ml-2" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search protocols, tasks, or insights..."
                className="flex-1 bg-transparent border-none text-white text-lg placeholder:text-white/10 focus:ring-0"
              />
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="mb-4 px-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Recommendations</span>
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
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-all border border-white/5">
                          {res.icon}
                        </div>
                        <div className="text-left">
                          <h4 className="text-white font-bold text-sm">{res.title}</h4>
                          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">{res.category}</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-white/0 group-hover:text-white/20 group-hover:-translate-x-2 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-white/20 text-sm font-bold uppercase tracking-widest">No matching protocols found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2"><kbd className="bg-white/5 px-1.5 py-0.5 rounded text-white/40">ESC</kbd> to close</span>
              </div>
              <span className="flex items-center gap-2">AI Search v2.0 <Zap size={10} className="text-indigo-500" /></span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
