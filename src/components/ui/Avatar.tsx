import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Avatar component variants
 */
const avatarVariants = cva(
  [
    'relative inline-flex items-center justify-center',
    'rounded-full overflow-hidden',
    'bg-gradient-avatar',
    'select-none',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-20 w-20 text-xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alt text for image
   */
  alt?: string;
  /**
   * Fallback initials (1-2 characters)
   */
  fallback?: string;
}

/**
 * Avatar Component
 * 
 * @example
 * ```tsx
 * <Avatar src="/profile.jpg" alt="User name" />
 * 
 * <Avatar fallback="JD" />
 * 
 * <Avatar src="/profile.jpg" fallback="JD" size="lg" />
 * ```
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);

    const showFallback = !src || imgError;

    return (
      <div
        className={cn(avatarVariants({ size, className }))}
        ref={ref}
        {...props}
      >
        {!showFallback && (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {showFallback && fallback && (
          <span className="font-semibold text-dusty-rose-700 uppercase">
            {fallback.slice(0, 2)}
          </span>
        )}
        {showFallback && !fallback && (
          <svg
            className="h-1/2 w-1/2 text-dusty-rose-400"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
