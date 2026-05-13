import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ElementType;
}

const VARIANTS: Record<string, any> = {
  primary:   { background: 'var(--accent)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border2)' },
  ghost:     { background: 'transparent', color: 'var(--text2)', border: 'none' },
  danger:    { background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid rgba(255,92,92,0.2)' },
  outline:   { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }
};

const SIZES: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs min-h-[32px]',
  md: 'px-4 py-2.5 text-sm min-h-[40px]',
  lg: 'px-5 py-3 text-sm min-h-[48px]',
  xl: 'px-6 py-3.5 text-base min-h-[52px]'
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  disabled,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 font-medium
      rounded-[var(--r-md)] transition-all active:scale-[0.97]
      disabled:opacity-50 disabled:cursor-not-allowed select-none
      ${fullWidth ? 'w-full' : ''} ${SIZES[size]} ${className}`}
    style={VARIANTS[variant]}
    {...props}
  >
    {loading && (
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
          strokeDasharray="60" strokeDashoffset="20" />
      </svg>
    )}
    {!loading && Icon && <Icon size={16} />}
    {children}
  </button>
);

export default Button;
