import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
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
 * Radio Component
 * 
 * @example
 * ```tsx
 * <Radio name="size" value="sm" label="Small" />
 * <Radio name="size" value="md" label="Medium" checked />
 * <Radio name="size" value="lg" label="Large" />
 * ```
 */
const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <div className="relative flex items-center">
            <input
              type="radio"
              id={radioId}
              ref={ref}
              className="peer sr-only"
              {...props}
            />
            <label
              htmlFor={radioId}
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2 cursor-pointer transition-all',
                'border-gray-300 bg-white',
                'peer-checked:border-dusty-rose-500',
                'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-dusty-rose-500 peer-focus-visible:ring-offset-2',
                'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                error && 'border-error peer-checked:border-error',
                className
              )}
            >
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full bg-dusty-rose-500 opacity-0 peer-checked:opacity-100 transition-opacity',
                  error && 'bg-error'
                )}
              />
            </label>
          </div>
          {label && (
            <label
              htmlFor={radioId}
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

Radio.displayName = 'Radio';

export { Radio };
