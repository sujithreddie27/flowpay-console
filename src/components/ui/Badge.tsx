import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  rounded?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      dot = false,
      rounded = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center font-medium transition-colors';

    const variants = {
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
      secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-300',
      success: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
      warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
      danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400',
      info: 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-sm gap-1.5',
      lg: 'px-3 py-1.5 text-base gap-2',
    };

    const dotVariants = {
      primary: 'bg-primary-500',
      secondary: 'bg-secondary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-primary-400',
    };

    const dotSizes = {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          rounded ? 'rounded-full' : 'rounded-md',
          className
        )}
        {...props}
      >
        {dot && (
          <span className={cn('rounded-full', dotVariants[variant], dotSizes[size])} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'pending' | 'processing' | 'completed' | 'success' | 'failed' | 'error' | 'cancelled' | 'active' | 'inactive' | 'draft';
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusMap: Record<StatusBadgeProps['status'], { variant: BadgeProps['variant']; label: string }> = {
      pending: { variant: 'warning', label: 'Pending' },
      processing: { variant: 'info', label: 'Processing' },
      completed: { variant: 'success', label: 'Completed' },
      success: { variant: 'success', label: 'Success' },
      failed: { variant: 'danger', label: 'Failed' },
      error: { variant: 'danger', label: 'Error' },
      cancelled: { variant: 'secondary', label: 'Cancelled' },
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'secondary', label: 'Inactive' },
      draft: { variant: 'secondary', label: 'Draft' },
    };

    const { variant, label } = statusMap[status];

    return (
      <Badge ref={ref} variant={variant} dot rounded {...props}>
        {label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
