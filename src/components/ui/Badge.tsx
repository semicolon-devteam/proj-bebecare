import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge component variants
 */
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'rounded-full px-2.5 py-1',
    'text-xs font-semibold',
    'transition-colors duration-200',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-dusty-rose-50 text-dusty-rose-700',
        secondary: 'bg-sage-50 text-sage-700',
        success: 'bg-green-50 text-green-700',
        warning: 'bg-amber-50 text-amber-700',
        error: 'bg-red-50 text-red-700',
        info: 'bg-blue-50 text-blue-700',
        outline: 'border border-gray-300 text-gray-700 bg-transparent',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icon to display before text
   */
  icon?: React.ReactNode;
}

/**
 * Badge Component
 * 
 * @example
 * ```tsx
 * <Badge>Default</Badge>
 * 
 * <Badge variant="success">Completed</Badge>
 * 
 * <Badge variant="warning" icon={<AlertIcon />}>
 *   Warning
 * </Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
