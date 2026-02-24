import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Textarea component variants
 */
const textareaVariants = cva(
  [
    'flex w-full rounded-input',
    'border border-gray-300 bg-white',
    'px-4 py-2.5',
    'text-sm text-gray-900 placeholder:text-gray-400',
    'shadow-sm',
    'transition-all duration-200',
    'focus:outline-none focus:border-dusty-rose-500 focus:ring-1 focus:ring-dusty-rose-500/20',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    'resize-y',
  ].join(' '),
  {
    variants: {
      error: {
        true: 'border-error focus:border-error focus:ring-error/20',
        false: '',
      },
    },
    defaultVariants: {
      error: false,
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  /**
   * Error state - changes border color to red
   */
  error?: boolean;
}

/**
 * Textarea Component
 * 
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message..." rows={4} />
 * 
 * <Textarea error placeholder="Invalid input" />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ error, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
