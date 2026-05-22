import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { motion } from 'framer-motion';

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
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.3 }}
      className="space-y-6 md:space-y-8 w-full"
    >
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-2">
          <SkeletonTheme {...THEME}>
            <Skeleton width={200} height={36} borderRadius={8} />
            <Skeleton width={120} height={14} borderRadius={4} />
          </SkeletonTheme>
        </div>
        <SkeletonTheme {...THEME}>
          <Skeleton width={140} height={48} borderRadius={12} />
        </SkeletonTheme>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <SkeletonChart />
          <div className="space-y-3">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
           <SkeletonTheme {...THEME}>
             <Skeleton width="100%" height={240} borderRadius={20} />
             <Skeleton width="100%" height={240} borderRadius={20} />
           </SkeletonTheme>
        </div>
      </div>
    </motion.div>
  );
};
