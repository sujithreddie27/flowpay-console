import { Skeleton } from '@/components/ui';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  height?: number;
  className?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartWrapper({
  title,
  subtitle,
  loading,
  error,
  empty,
  emptyMessage = 'No data available for the selected period.',
  height = 320,
  className = '',
  headerAction,
  children,
}: ChartWrapperProps) {
  return (
    <div
      className={`rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
              {subtitle}
            </p>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Chart Body */}
      <div className="px-6 py-4" style={{ minHeight: height }}>
        {loading ? (
          <ChartSkeleton height={height - 32} />
        ) : error ? (
          <ChartError height={height - 32} />
        ) : empty ? (
          <ChartEmpty height={height - 32} message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="flex flex-col justify-end gap-2" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            className="flex-1 rounded-t"
            height={`${30 + Math.random() * 60}%`}
          />
        ))}
      </div>
      <Skeleton variant="text" width="60%" height={12} />
    </div>
  );
}

function ChartError({ height }: { height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ height }}
    >
      <ExclamationTriangleIcon className="h-10 w-10 text-danger-400 dark:text-danger-500" />
      <p className="mt-3 text-sm font-medium text-secondary-600 dark:text-secondary-400">
        Failed to load chart data
      </p>
      <p className="mt-1 text-xs text-secondary-400 dark:text-secondary-500">
        Please try refreshing the page.
      </p>
    </div>
  );
}

function ChartEmpty({ height, message }: { height: number; message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ height }}
    >
      <ChartBarIcon className="h-10 w-10 text-secondary-300 dark:text-secondary-600" />
      <p className="mt-3 text-sm font-medium text-secondary-500 dark:text-secondary-400">
        {message}
      </p>
    </div>
  );
}
