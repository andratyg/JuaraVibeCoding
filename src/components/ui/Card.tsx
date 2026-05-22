import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { cardHover } from '../../utils/animations';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  noPadding?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', accent = false, noPadding = false, hoverable = true, onClick, ...props }) => {
  return (
    <motion.div 
      {...props}
      {...(hoverable ? cardHover : {})}
      onClick={onClick}
      className={cn("rounded-[var(--r-xl)] border transition-all bg-[var(--surface2)]", accent ? 'border-[var(--accent-bg)]' : 'border-[var(--border)]', hoverable && 'cursor-pointer', className)}
      style={{
        padding: noPadding ? 0 : 'clamp(14px, 2vw, 24px)',
        ...props.style
      }}
    >
      {children}
    </motion.div>
  );
};

export default Card;
