import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', accent = false, noPadding = false }) => (
  <div className={`rounded-[var(--r-xl)] border transition-all ${className}`}
    style={{
      background: 'var(--surface2)',
      borderColor: accent ? 'var(--accent-bg)' : 'var(--border)',
      padding: noPadding ? 0 : 'clamp(14px, 2vw, 24px)'
    }}>
    {children}
  </div>
);

export default Card;
