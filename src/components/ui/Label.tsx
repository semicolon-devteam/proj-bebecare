import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Error message to display
   */
  error?: string;
}

/**
 * Label Component
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Input id="email" type="email" />
 * 
 * <Label htmlFor="name" required>Name</Label>
 * <Input id="name" />
 * 
 * <Label htmlFor="password" error="Password is required">
 *   Password
 * </Label>
 * <Input id="password" type="password" error />
 * ```
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, error, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label
          className={cn(
            'block text-sm font-semibold text-gray-600',
            error && 'text-error',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Label.displayName = 'Label';

export { Label };
