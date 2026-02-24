import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorMessageProps {
  /**
   * Error message text
   */
  message: string;
  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * ErrorMessage Component
 * Displays error messages with icon
 * 
 * @example
 * ```tsx
 * <ErrorMessage message="Invalid email address" />
 * ```
 */
export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1">{message}</p>
    </div>
  );
}

export default ErrorMessage;
