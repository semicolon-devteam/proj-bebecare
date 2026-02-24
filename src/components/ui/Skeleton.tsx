import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant of skeleton
   */
  variant?: 'text' | 'circular' | 'rectangular';
  /**
   * Width (can be number for pixels or string for other units)
   */
  width?: number | string;
  /**
   * Height (can be number for pixels or string for other units)
   */
  height?: number | string;
}

/**
 * Skeleton Component - Loading placeholder
 * 
 * @example
 * ```tsx
 * <Skeleton variant="text" width="100%" height={20} />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" width="100%" height={200} />
 * ```
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangular', width, height, style, ...props }, ref) => {
    const variantClasses = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-lg',
    };

    const inlineStyles: React.CSSProperties = {
      ...style,
      ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
    };

    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-gray-200',
          variantClasses[variant],
          className
        )}
        style={inlineStyles}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
