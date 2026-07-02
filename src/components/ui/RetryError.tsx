import { ArrowPathIcon, ExclamationCircleIcon, WifiIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils';

export interface RetryErrorProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  variant?: 'inline' | 'card' | 'full';
  className?: string;
}

export function RetryError({
  title = 'Failed to load data',
  message = 'Something went wrong. Please check your connection and try again.',
  onRetry,
  isRetrying = false,
  variant = 'card',
  className,
}: RetryErrorProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 px-4 py-3', className)}>
        <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-danger-500" />
        <p className="flex-1 text-sm text-danger-700 dark:text-danger-300">{message}</p>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1.5 rounded-md bg-danger-100 dark:bg-danger-900/40 px-3 py-1.5 text-xs font-medium text-danger-700 dark:text-danger-300 hover:bg-danger-200 dark:hover:bg-danger-800/60 disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon className={cn('h-3.5 w-3.5', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex min-h-[300px] items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/30">
            <WifiIcon className="h-7 w-7 text-danger-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-secondary-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-secondary-500 dark:text-secondary-400">
            {message}
          </p>
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            <ArrowPathIcon className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={cn('rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-6 text-center', className)}>
      <ExclamationCircleIcon className="mx-auto h-10 w-10 text-danger-400" />
      <h3 className="mt-3 text-base font-semibold text-secondary-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-secondary-500 dark:text-secondary-400">
        {message}
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
      >
        <ArrowPathIcon className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
        {isRetrying ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  );
}
