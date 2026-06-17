import React from 'react';

export interface InputProps {
  label?: string;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  helperText?: string;
}

export function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  required = false,
  disabled = false,
  icon,
  helperText,
}: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full rounded-btn border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 ${icon ? 'pl-10' : ''}`}
        />
      </div>
      {helperText && (
        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
