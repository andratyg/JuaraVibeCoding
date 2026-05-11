import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

const Input: React.FC<InputProps> = ({ label, placeholder, error, icon: Icon, type = 'text', ...props }) => {
  const [show, setShow] = useState(false);
  const isPw = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wider text-[var(--text3)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text3)]">
            <Icon size={15} />
          </div>
        )}
        <input
          type={isPw && show ? 'text' : type}
          placeholder={placeholder}
          className="w-full rounded-[var(--r-md)] placeholder:opacity-30
            focus:outline-none transition-all"
          style={{
            padding: `12px ${isPw ? '44px' : '16px'} 12px ${Icon ? '40px' : '16px'}`,
            fontSize: 'max(16px, 0.875rem)',
            background: 'var(--surface)',
            border: `1.5px solid ${error ? 'var(--error)' : 'var(--border2)'}`,
            color: 'var(--text)'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = error ? 'var(--error)' : 'var(--border2)')}
          {...props}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] mt-1.5 flex items-center gap-1 text-[var(--error)]">
          ⚠ {error}
        </p>
      )}
    </div>
  );
};

export default Input;
