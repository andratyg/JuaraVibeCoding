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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0D0F14] border-l border-white/5 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Bell size={18} />
                </div>
                <h3 className="text-white font-bold">Notifications</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl text-white/40 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Bell size={20} className="text-white/20" />
                  </div>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No new updates</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all hover:bg-white/5 cursor-pointer",
                      n.read ? "bg-transparent border-white/5" : "bg-white/[0.02] border-indigo-500/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-2 rounded-xl mt-0.5",
                        n.type === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                        n.type === 'warning' ? "bg-amber-500/10 text-amber-400" :
                        "bg-indigo-500/10 text-indigo-400"
                      )}>
                        {n.type === 'success' ? <CheckCircle2 size={16} /> :
                         n.type === 'warning' ? <AlertCircle size={16} /> :
                         <Info size={16} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white text-sm font-bold mb-1">{n.title}</h4>
                        <p className="text-white/50 text-xs leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                          <Clock size={10} /> {n.time}
                        </div>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              <button 
                onClick={onMarkAllRead}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all"
              >
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
