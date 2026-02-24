import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button component variants using CVA
 * Design System: DESIGN_SYSTEM.md
 */
const buttonVariants = cva(
  // Base styles (always applied)
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold text-center',
    'rounded-button',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-rose-500 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-cta text-white',
          'hover:shadow-warm-md hover:scale-[1.02]',
          'active:scale-[0.98]',
        ].join(' '),
        secondary: [
          'bg-sage-400 text-white',
          'hover:bg-sage-500 hover:shadow-warm-md',
          'active:bg-sage-600',
        ].join(' '),
        outline: [
          'border-2 border-dusty-rose-500 text-dusty-rose-500 bg-transparent',
          'hover:bg-dusty-rose-50 hover:shadow-warm',
          'active:bg-dusty-rose-100',
        ].join(' '),
        ghost: [
          'text-dusty-rose-500 bg-transparent',
          'hover:bg-dusty-rose-50',
          'active:bg-dusty-rose-100',
        ].join(' '),
        destructive: [
          'bg-error text-white',
          'hover:bg-red-600 hover:shadow-md',
          'active:bg-red-700',
        ].join(' '),
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3.5 text-lg',
        xl: 'px-8 py-4 text-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Loading state - shows spinner and disables button
   */
  loading?: boolean;
  /**
   * Icon to display before text (React component or element)
   */
  icon?: React.ReactNode;
  /**
   * Icon to display after text
   */
  iconAfter?: React.ReactNode;
}

/**
 * Button Component
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 * 
 * <Button variant="outline" loading>
 *   Loading...
 * </Button>
 * 
 * <Button icon={<PlusIcon />}>
 *   Add Item
 * </Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      icon,
      iconAfter,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {!loading && iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
