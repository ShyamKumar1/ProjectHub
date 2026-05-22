'use client';

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg transition-all duration-450',
          {
            'bg-dark-800/80 backdrop-blur-sm border border-dark-300': variant === 'glass',
            'bg-dark-800/60 border border-dark-300': variant === 'bordered',
            'bg-dark-800': variant === 'default',
            'hover:border-accent/30 hover:shadow-glow cursor-pointer': hover,
          },
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
export default Card;
