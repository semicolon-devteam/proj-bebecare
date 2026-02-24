import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Input component variants
 */
const inputVariants = cva(
  [
    'flex w-full rounded-input',
    'border border-gray-300 bg-white',
    'px-4 py-2.5',
    'text-sm text-gray-900 placeholder:text-gray-400',
    'shadow-sm',
    'transition-all duration-200',
    'focus:outline-none focus:border-dusty-rose-500 focus:ring-1 focus:ring-dusty-rose-500/20',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
  ].join(' '),
  {
    variants: {
      error: {
        true: [
          'border-error focus:border-error focus:ring-error/20',
        ].join(' '),
        false: '',
      },
    },
    defaultVariants: {
      error: false,
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /**
   * Error state - changes border color to red
   */
  error?: boolean;
  /**
   * Icon to display before input (left side)
   */
  icon?: React.ReactNode;
  /**
   * Icon to display after input (right side)
   */
  iconAfter?: React.ReactNode;
}

/**
 * Input Component
 * 
 * @example
 * ```tsx
 * <Input type="email" placeholder="your@email.com" />
 * 
 * <Input error placeholder="Invalid email" />
 * 
 * <Input icon={<SearchIcon />} placeholder="Search..." />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, iconAfter, ...props }, ref) => {
    if (icon || iconAfter) {
      return (
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            className={cn(
              inputVariants({ error, className }),
              icon && 'pl-10',
              iconAfter && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          {iconAfter && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {iconAfter}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        className={cn(inputVariants({ error, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
