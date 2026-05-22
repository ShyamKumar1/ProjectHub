'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-450',
          'focus:outline-none focus:ring-2 focus:ring-accent/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            // Variants
            'bg-accent text-dark-800 hover:bg-accent-600 active:bg-accent-700':
              variant === 'primary',
            'border border-dark-300 text-text-primary hover:bg-dark-700 active:bg-dark-800':
              variant === 'secondary',
            'text-text-secondary hover:text-text-primary hover:bg-dark-700':
              variant === 'ghost',
            'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30':
              variant === 'danger',
            // Sizes
            'text-xs px-3 py-1.5 rounded-md gap-1.5': size === 'sm',
            'text-sm px-4 py-2 rounded-lg gap-2': size === 'md',
            'text-body px-6 py-3 rounded-lg gap-2.5': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
