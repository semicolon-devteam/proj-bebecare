import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Progress component variants
 */
const progressVariants = cva('h-2 w-full overflow-hidden rounded-full bg-gray-100', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const progressBarVariants = cva(
  'h-full rounded-full transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'bg-dusty-rose-500',
        secondary: 'bg-sage-400',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        error: 'bg-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressBarVariants> {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Show percentage label
   */
  showLabel?: boolean;
  /**
   * Custom label
   */
  label?: string;
}

/**
 * Progress Component
 * 
 * @example
 * ```tsx
 * <Progress value={50} />
 * 
 * <Progress value={75} variant="success" showLabel />
 * 
 * <Progress value={30} label="Uploading..." />
 * ```
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, variant, size, showLabel, label, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div ref={ref} className="space-y-1" {...props}>
        {(showLabel || label) && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            {label && <span>{label}</span>}
            {showLabel && <span>{clampedValue}%</span>}
          </div>
        )}
        <div
          className={cn(progressVariants({ size, className }))}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(progressBarVariants({ variant }))}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, progressVariants, progressBarVariants };
