import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { LogOut, User, Settings, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileDropdownProps {
  onClose: () => void;
}

export default function ProfileDropdown({ onClose }: ProfileDropdownProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
    onClose();
  };

  const menuItems = [
    { label: 'Profile Saya', icon: User, action: () => navigate('/profile') },
    { label: 'Pengaturan', icon: Settings, action: () => navigate('/settings') },
    { label: 'Keamanan', icon: Shield, action: () => {} },
  ];

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="absolute bottom-20 left-4 right-4 md:bottom-auto md:top-16 md:right-8 md:left-auto w-auto min-w-[220px] bg-[#1E2330] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 bg-white/5">
          <p className="text-white text-sm font-bold">{auth.currentUser?.displayName || 'User'}</p>
          <p className="text-white/40 text-[11px] truncate">{auth.currentUser?.email}</p>
        </div>
        
        <div className="p-2">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 text-sm hover:bg-white/5 transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 text-sm hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Keluar Sesi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
