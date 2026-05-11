import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', accent = false }) => (
  <div className={`rounded-[var(--r-xl)] border transition-all ${className}`}
    style={{
      background: 'var(--surface2)',
      borderColor: accent ? 'var(--accent-bg)' : 'var(--border)',
      padding: 'var(--card-p)'
    }}>
    {children}
  </div>
);

export default Card;
