import { ReactNode } from 'react';
import { cn } from '@/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-400 dark:text-secondary-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-secondary-500 dark:text-secondary-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                action.variant === 'secondary'
                  ? 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              )}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
