import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Select component variants
 */
const selectVariants = cva(
  [
    'flex w-full rounded-input',
    'border border-gray-300 bg-white',
    'px-4 py-2.5',
    'text-sm text-gray-900',
    'shadow-sm',
    'transition-all duration-200',
    'focus:outline-none focus:border-dusty-rose-500 focus:ring-1 focus:ring-dusty-rose-500/20',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    'appearance-none cursor-pointer',
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

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  /**
   * Error state - changes border color to red
   */
  error?: boolean;
}

/**
 * Select Component
 * 
 * @example
 * ```tsx
 * <Select>
 *   <option value="">선택해주세요</option>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 * 
 * <Select error>
 *   <option value="">Invalid selection</option>
 * </Select>
 * ```
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(selectVariants({ error, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select, selectVariants };
