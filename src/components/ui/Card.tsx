import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', accent = false, noPadding = false }) => {
  return (
    <div 
      className={cn("rounded-[var(--r-xl)] border transition-all bg-[var(--surface2)]", accent ? 'border-[var(--accent-bg)]' : 'border-[var(--border)]', className)}
      style={{
        padding: noPadding ? 0 : 'clamp(14px, 2vw, 24px)'
      }}
    >
      {children}
    </div>
  );
};

export default Card;
