import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  placeholder, 
  error, 
  icon: Icon, 
  type='text', 
  fullWidth, // consume it here
  ...props 
}) => {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  
  return (
    <div className="w-full">
      {label && (
        <label 
          className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
          style={{ color: 'var(--text3)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text3)' }}
          >
            <Icon size={15}/>
          </div>
        )}
        <input 
          type={isPassword && showPw ? 'text' : type}
          placeholder={placeholder}
          className="w-full rounded-[var(--r-md)] placeholder:opacity-30
            focus:outline-none transition-all duration-200"
          style={{
            padding: `12px ${isPassword ? '44px' : '16px'} 12px ${Icon ? '40px' : '16px'}`,
            fontSize: 'max(16px, 0.875rem)',
            background: 'var(--surface)',
            border: `1.5px solid ${error ? 'var(--error)' : 'var(--border2)'}`,
            color: 'var(--text)'
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = error ? 'var(--error)' : 'var(--border2)')}
          {...props} 
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text3)' }}
          >
            {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--error)' }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
};

export default Input;
