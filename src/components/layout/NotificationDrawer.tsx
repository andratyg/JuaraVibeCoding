import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Info, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  time: string;
  read: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export default function NotificationDrawer({ isOpen, onClose, notifications, onMarkAllRead }: NotificationDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l border-slate-100 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <Bell size={18} />
                </div>
                <h3 className="text-slate-900 font-black uppercase tracking-tight">Updates</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Bell size={20} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No new updates</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all hover:bg-slate-50 cursor-pointer group",
                      n.read ? "bg-slate-50 border-slate-100" : "bg-white border-indigo-200 shadow-md shadow-indigo-50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-xl mt-0.5",
                        n.type === 'success' ? "bg-emerald-50 text-emerald-600" :
                        n.type === 'warning' ? "bg-amber-50 text-amber-600" :
                        "bg-indigo-50 text-indigo-600"
                      )}>
                        {n.type === 'success' ? <CheckCircle2 size={16} /> :
                         n.type === 'warning' ? <AlertCircle size={16} /> :
                         <Info size={16} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-slate-900 text-sm font-black mb-1 tracking-tight">{n.title}</h4>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          <Clock size={10} /> {n.time}
                        </div>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-rose-500 rounded-full mt-1.5 shadow-lg shadow-rose-100" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-50">
              <button 
                onClick={onMarkAllRead}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-slate-100"
              >
                Archive All
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
