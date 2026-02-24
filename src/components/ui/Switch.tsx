import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text
   */
  label?: string;
  /**
   * Description text
   */
  description?: string;
}

/**
 * Switch Component (Toggle)
 * 
 * @example
 * ```tsx
 * <Switch label="Enable notifications" />
 * 
 * <Switch 
 *   checked={enabled} 
 *   onChange={(e) => setEnabled(e.target.checked)}
 *   label="Dark mode"
 *   description="Switch to dark theme"
 * />
 * ```
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={switchId}
            className={cn(
              'flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors',
              'bg-gray-200',
              'peer-checked:bg-dusty-rose-500',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-dusty-rose-500 peer-focus-visible:ring-offset-2',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              className
            )}
          >
            <div
              className={cn(
                'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                'translate-x-1',
                'peer-checked:translate-x-6'
              )}
            />
          </label>
        </div>
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={switchId}
                className={cn(
                  'text-sm font-medium text-gray-700 cursor-pointer select-none block',
                  props.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
