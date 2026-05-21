import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const THEME = { baseColor: '#1A1E28', highlightColor: '#252A35' };

export const SkeletonStatCard: React.FC = () => (
  <SkeletonTheme {...THEME}>
    <div className="rounded-[var(--r-xl)] border p-4"
      style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
      <Skeleton width={80} height={11} borderRadius={4} />
      <Skeleton width={100} height={28} borderRadius={6} style={{ marginTop: 8 }} />
      <Skeleton width={60} height={10} borderRadius={4} style={{ marginTop: 6 }} />
    </div>
  </SkeletonTheme>
);

export const SkeletonListItem: React.FC = () => (
  <SkeletonTheme {...THEME}>
    <div className="rounded-[var(--r-lg)] border p-4 flex gap-3"
      style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
      <Skeleton circle width={40} height={40} />
      <div className="flex-1">
        <Skeleton width="60%" height={12} borderRadius={4} />
        <Skeleton width="40%" height={10} borderRadius={4} style={{ marginTop: 6 }} />
      </div>
    </div>
  </SkeletonTheme>
);

export const SkeletonChart: React.FC = () => (
  <SkeletonTheme {...THEME}>
    <div className="rounded-[var(--r-xl)] border p-5"
      style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
      <Skeleton width={140} height={14} borderRadius={4} />
      <Skeleton width="100%" height={180} borderRadius={8} style={{ marginTop: 16 }} />
    </div>
  </SkeletonTheme>
);

export const SkeletonPage: React.FC = () => {
  const { t } = useTranslation();
  return (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center h-[60vh] w-full"
  >
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center mb-6">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--border2)] absolute" />
        <Loader2 className="h-12 w-12 animate-[spin_2s_linear_reverse_infinite] text-[var(--accent)] relative" />
      </div>
      <h1 className="text-xl font-black tracking-[0.3em] text-[var(--accent)] uppercase animate-pulse">Velora</h1>
      <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-widest mt-2 animate-pulse">{t('common.preparingWorkspace', 'Menyiapkan Ruang Kerja')}</p>
    </div>
  </motion.div>
  );
};
