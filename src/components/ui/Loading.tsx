import { HTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'white';
}

export const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const variants = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
  };

  return (
    <div
      className={cn('inline-block animate-spin', sizes[size], variants[variant], className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  rows?: number;
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  rows = 1,
  className,
  ...props
}: SkeletonProps) => {
  const baseStyles = 'animate-pulse bg-secondary-200 dark:bg-secondary-700';

  const variants = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  if (variant === 'text' && rows > 1) {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variants[variant])}
            style={{
              width: i === rows - 1 ? '70%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={style}
      {...props}
    />
  );
};

export interface SkeletonCardProps {
  rows?: number;
  className?: string;
}

export const SkeletonCard = ({ rows = 3, className }: SkeletonCardProps) => {
  return (
    <div className={cn('p-6 bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-800', className)}>
      <Skeleton variant="rectangular" height={24} width="60%" className="mb-4" />
      <Skeleton variant="text" rows={rows} />
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable = ({ rows = 5, columns = 4, className }: SkeletonTableProps) => {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-secondary-200 dark:border-secondary-800', className)}>
      <table className="w-full">
        <thead className="bg-secondary-50 dark:bg-secondary-800">
          <tr>
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-6 py-3">
                <Skeleton variant="text" height={16} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-secondary-900 divide-y divide-secondary-200 dark:divide-secondary-800">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <Skeleton variant="text" height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
