import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
}

export default function PasswordInput({ value, onChange, placeholder = 'Password', id, required }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative mb-3">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Lock size={16} />
      </div>
      <input
        type={show ? 'text' : 'password'}
        id={id}
        required={required}
        autoCapitalize="none"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-3 border-2 border-gray-100 rounded-xl text-sm bg-white focus:border-[#4B4ACF] focus:outline-none transition-colors placeholder:text-gray-300 min-h-[44px] md:min-h-[48px]"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
