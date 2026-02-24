import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text
   */
  label?: string;
  /**
   * Error message
   */
  error?: string;
}

/**
 * Checkbox Component
 * 
 * @example
 * ```tsx
 * <Checkbox label="I agree to terms" />
 * 
 * <Checkbox 
 *   checked={checked} 
 *   onChange={(e) => setChecked(e.target.checked)}
 *   label="Subscribe to newsletter"
 * />
 * ```
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id={checkboxId}
              ref={ref}
              className="peer sr-only"
              {...props}
            />
            <label
              htmlFor={checkboxId}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border-2 cursor-pointer transition-all',
                'border-gray-300 bg-white',
                'peer-checked:border-dusty-rose-500 peer-checked:bg-dusty-rose-500',
                'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-dusty-rose-500 peer-focus-visible:ring-offset-2',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                error && 'border-error peer-checked:border-error peer-checked:bg-error',
                className
              )}
            >
              <Check
                className={cn(
                  'h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity',
                  'peer-disabled:text-gray-400'
                )}
                aria-hidden="true"
              />
            </label>
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm text-gray-700 cursor-pointer select-none flex-1',
                error && 'text-error',
                props.disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="text-xs text-error pl-7" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
