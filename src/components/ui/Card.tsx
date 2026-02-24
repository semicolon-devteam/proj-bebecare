import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card component variants
 */
const cardVariants = cva(
  [
    'bg-white border border-border rounded-card',
    'transition-all duration-200',
  ].join(' '),
  {
    variants: {
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-warm-sm',
        base: 'shadow-warm',
        md: 'shadow-warm-md',
        lg: 'shadow-warm-lg',
        xl: 'shadow-warm-xl',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-warm-md hover:scale-[1.005]',
        shadow: 'hover:shadow-warm-lg',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      shadow: 'base',
      hover: 'none',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Card Component
 * 
 * @example
 * ```tsx
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 * 
 * <Card shadow="lg" hover="lift">
 *   Interactive card
 * </Card>
 * 
 * <Card padding="none">
 *   <img src="..." />
 *   <div className="p-4">Content</div>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, shadow, hover, padding, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ shadow, hover, padding, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Optional card header component
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Optional card title component
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-h4 font-semibold text-gray-900', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Optional card description component
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-body-sm text-gray-500', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Optional card content container
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * CardFooter - Optional card footer component
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-2', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
