import { cn } from '@/utils';

// ============================================================================
// LiveIndicator - Pulsing badge indicating real-time connection status
// ============================================================================

export type LiveIndicatorStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';

export interface LiveIndicatorProps {
  status: LiveIndicatorStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<
  LiveIndicatorStatus,
  { color: string; pulse: boolean; label: string }
> = {
  connected: {
    color: 'bg-success-500',
    pulse: true,
    label: 'Live',
  },
  connecting: {
    color: 'bg-warning-500',
    pulse: true,
    label: 'Connecting',
  },
  reconnecting: {
    color: 'bg-warning-500',
    pulse: true,
    label: 'Reconnecting',
  },
  disconnected: {
    color: 'bg-secondary-400',
    pulse: false,
    label: 'Offline',
  },
};

export function LiveIndicator({
  status,
  showLabel = true,
  size = 'sm',
  className,
}: LiveIndicatorProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  const pulseSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        showLabel && 'px-2.5 py-1 text-xs font-medium',
        showLabel && status === 'connected' && 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400',
        showLabel && status === 'connecting' && 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
        showLabel && status === 'reconnecting' && 'bg-warning-50 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
        showLabel && status === 'disconnected' && 'bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400',
        className
      )}
      aria-label={`Connection status: ${config.label}`}
    >
      <span className="relative flex">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.color,
              pulseSize
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', config.color, dotSize)} />
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
