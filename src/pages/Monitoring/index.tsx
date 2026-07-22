import { useState, useCallback } from 'react';
import {
  ServerStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BellAlertIcon,
  ClockIcon,
  SignalIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Badge, Button, Card, LoadingSpinner } from '@/components/ui';
import {
  useSystemHealth,
  useApiResponseTimes,
  useErrorRates,
  useKafkaConsumerLag,
  useMonitoringAlerts,
  useAcknowledgeMonitoringAlert,
  useResolveMonitoringAlert,
} from '@/hooks/useMonitoring';
import type {
  MonitoringAlert,
  KafkaLagResponse,
} from '@/types';
import { cn } from '@/utils';

// ============================================================================
// Constants
// ============================================================================

type RefreshInterval = 10_000 | 30_000 | 60_000;

const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: '10s', value: 10_000 },
  { label: '30s', value: 30_000 },
  { label: '60s', value: 60_000 },
];

// ============================================================================
// Helpers
// ============================================================================

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Map actuator status string to a UI status */
function mapActuatorStatus(status: string): 'up' | 'degraded' | 'down' {
  const upper = status.toUpperCase();
  if (upper === 'UP') return 'up';
  if (upper === 'DOWN' || upper === 'OUT_OF_SERVICE') return 'down';
  return 'degraded';
}

/** Map actuator overall status to banner status */
function mapOverallStatus(status: string): 'healthy' | 'degraded' | 'down' {
  const mapped = mapActuatorStatus(status);
  if (mapped === 'up') return 'healthy';
  if (mapped === 'down') return 'down';
  return 'degraded';
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatusIcon({ status }: { status: 'up' | 'degraded' | 'down' }) {
  switch (status) {
    case 'up':
      return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
    case 'degraded':
      return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
    case 'down':
      return <XCircleIcon className="h-5 w-5 text-danger-500" />;
  }
}

function StatusBadge({ status }: { status: 'up' | 'degraded' | 'down' }) {
  const map: Record<'up' | 'degraded' | 'down', { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    up: { variant: 'success', label: 'Healthy' },
    degraded: { variant: 'warning', label: 'Degraded' },
    down: { variant: 'danger', label: 'Down' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant} size="sm" dot rounded>{label}</Badge>;
}

function OverallStatusBanner({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const config = {
    healthy: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      border: 'border-success-200 dark:border-success-800',
      text: 'text-success-800 dark:text-success-300',
      icon: <CheckCircleIcon className="h-5 w-5 text-success-500" />,
      label: 'All Systems Operational',
    },
    degraded: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-800 dark:text-warning-300',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />,
      label: 'Partial System Degradation',
    },
    down: {
      bg: 'bg-danger-50 dark:bg-danger-900/20',
      border: 'border-danger-200 dark:border-danger-800',
      text: 'text-danger-800 dark:text-danger-300',
      icon: <XCircleIcon className="h-5 w-5 text-danger-500" />,
      label: 'Major System Outage',
    },
  };
  const c = config[status];

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', c.bg, c.border)}>
      {c.icon}
      <span className={cn('text-sm font-semibold', c.text)}>{c.label}</span>
    </div>
  );
}

// ---- Component Health Card ----
function ComponentHealthCard({ name, status }: { name: string; status: string }) {
  const uiStatus = mapActuatorStatus(status);
  return (
    <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-white px-4 py-3 dark:border-secondary-700 dark:bg-secondary-800">
      <div className="flex items-center gap-3">
        <StatusIcon status={uiStatus} />
        <p className="text-sm font-medium text-secondary-900 dark:text-white capitalize">
          {name}
        </p>
      </div>
      <StatusBadge status={uiStatus} />
    </div>
  );
}

// ---- Metric Card ----
function MetricCard({
  label,
  value,
  sublabel,
  variant = 'default',
}: {
  label: string;
  value: string;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colorMap = {
    default: 'text-secondary-900 dark:text-white',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    danger: 'text-danger-600 dark:text-danger-400',
  };
  return (
    <div className="rounded-lg border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-800">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', colorMap[variant])}>{value}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-secondary-400 dark:text-secondary-500">{sublabel}</p>
      )}
    </div>
  );
}

// ---- Alert Row ----
function AlertRow({
  alert,
  onAcknowledge,
  onResolve,
  isAcknowledging,
  isResolving,
}: {
  alert: MonitoringAlert;
  onAcknowledge: (type: string) => void;
  onResolve: (type: string) => void;
  isAcknowledging: boolean;
  isResolving: boolean;
}) {
  const severityUpper = alert.severity.toUpperCase();
  const severityVariant: 'danger' | 'warning' | 'info' =
    severityUpper === 'CRITICAL' ? 'danger' : severityUpper === 'WARNING' ? 'warning' : 'info';

  return (
    <div className="flex items-start justify-between gap-4 border-b border-secondary-100 px-4 py-3 last:border-b-0 dark:border-secondary-700">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5">
          {severityUpper === 'CRITICAL' ? (
            <XCircleIcon className="h-5 w-5 text-danger-500" />
          ) : severityUpper === 'WARNING' ? (
            <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />
          ) : (
            <SignalIcon className="h-5 w-5 text-primary-500" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
              {alert.title}
            </p>
            <Badge variant={severityVariant} size="sm" rounded>
              {alert.severity}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2">
            {alert.description}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-secondary-400 dark:text-secondary-500">
            <span>Service: {alert.service}</span>
            <span>
              Value: {alert.currentValue.toFixed(2)} (threshold: {alert.threshold})
            </span>
            {alert.firedAt && (
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {relativeTime(alert.firedAt)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAcknowledge(alert.alertType)}
          isLoading={isAcknowledging}
          disabled={isAcknowledging}
        >
          Acknowledge
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onResolve(alert.alertType)}
          isLoading={isResolving}
          disabled={isResolving}
        >
          Resolve
        </Button>
      </div>
    </div>
  );
}

// ---- Kafka Lag Table ----
function KafkaLagSection({
  data,
  loading,
  error,
}: {
  data?: KafkaLagResponse;
  loading: boolean;
  error: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-secondary-500 dark:text-secondary-400">
        <ExclamationTriangleIcon className="h-8 w-8 text-danger-400" />
        <p className="mt-2 text-sm">Failed to load Kafka metrics</p>
      </div>
    );
  }

  const groups = data?.consumerGroups;
  if (!groups || Object.keys(groups).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-secondary-400 dark:text-secondary-500">
        <ServerStackIcon className="h-8 w-8" />
        <p className="mt-2 text-sm">No consumer lag data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-secondary-200 dark:border-secondary-700">
            <th className="px-4 py-2 text-left font-medium text-secondary-600 dark:text-secondary-400">Consumer Group</th>
            <th className="px-4 py-2 text-left font-medium text-secondary-600 dark:text-secondary-400">Partition</th>
            <th className="px-4 py-2 text-right font-medium text-secondary-600 dark:text-secondary-400">Lag</th>
            <th className="px-4 py-2 text-right font-medium text-secondary-600 dark:text-secondary-400">Total Group Lag</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groups).map(([groupName, group]) =>
            Object.entries(group.partitionLag).map(([partition, lag], idx) => (
              <tr
                key={`${groupName}-${partition}`}
                className="border-b border-secondary-100 last:border-b-0 dark:border-secondary-800"
              >
                {idx === 0 ? (
                  <td
                    className="px-4 py-2 font-mono text-xs text-secondary-900 dark:text-white"
                    rowSpan={Object.keys(group.partitionLag).length}
                  >
                    {groupName}
                  </td>
                ) : null}
                <td className="px-4 py-2 font-mono text-xs text-secondary-600 dark:text-secondary-300">
                  {partition}
                </td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={cn(
                      'font-semibold font-mono text-xs',
                      lag > 10_000
                        ? 'text-danger-600 dark:text-danger-400'
                        : lag > 1_000
                          ? 'text-warning-600 dark:text-warning-400'
                          : 'text-success-600 dark:text-success-400'
                    )}
                  >
                    {formatNumber(lag)}
                  </span>
                </td>
                {idx === 0 ? (
                  <td
                    className="px-4 py-2 text-right font-semibold font-mono text-xs text-secondary-900 dark:text-white"
                    rowSpan={Object.keys(group.partitionLag).length}
                  >
                    {formatNumber(group.totalLag)}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// MonitoringPage
// ============================================================================

export function MonitoringPage() {
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30_000);
  const [refreshOpen, setRefreshOpen] = useState(false);

  // Queries with configurable auto-refresh
  const healthQuery = useSystemHealth(refreshInterval);
  const responseTimesQuery = useApiResponseTimes(refreshInterval);
  const errorRatesQuery = useErrorRates(refreshInterval);
  const kafkaLagQuery = useKafkaConsumerLag(refreshInterval);
  const alertsQuery = useMonitoringAlerts(refreshInterval);

  const acknowledgeMutation = useAcknowledgeMonitoringAlert();
  const resolveMutation = useResolveMonitoringAlert();

  const handleRefreshAll = useCallback(() => {
    healthQuery.refetch();
    responseTimesQuery.refetch();
    errorRatesQuery.refetch();
    kafkaLagQuery.refetch();
    alertsQuery.refetch();
  }, [healthQuery, responseTimesQuery, errorRatesQuery, kafkaLagQuery, alertsQuery]);

  const alerts = alertsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            System Monitoring
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Real-time system health, performance metrics, and alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="relative">
            <button
              onClick={() => setRefreshOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm font-medium text-secondary-700 shadow-sm hover:bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-secondary-700"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Auto-refresh: {REFRESH_OPTIONS.find((o) => o.value === refreshInterval)?.label}
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
            {refreshOpen && (
              <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-secondary-200 bg-white py-1 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
                {REFRESH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setRefreshInterval(option.value);
                      setRefreshOpen(false);
                    }}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm',
                      refreshInterval === option.value
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-secondary-700 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700'
                    )}
                  >
                    Every {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handleRefreshAll} leftIcon={<ArrowPathIcon className="h-4 w-4" />}>
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      {healthQuery.data && (
        <OverallStatusBanner status={mapOverallStatus(healthQuery.data.status)} />
      )}

      {/* Service Health Grid */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
          <div className="flex items-center gap-2">
            <ServerStackIcon className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
              Service Health
            </h2>
          </div>
        </div>
        <div className="p-4">
          {healthQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : healthQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-secondary-500">
              <ExclamationTriangleIcon className="h-8 w-8 text-danger-400" />
              <p className="mt-2 text-sm">Failed to load service health</p>
            </div>
          ) : healthQuery.data?.components ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(healthQuery.data.components).map(([name, comp]) => (
                <ComponentHealthCard key={name} name={name} status={comp.status} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-secondary-400">
              <ServerStackIcon className="h-8 w-8" />
              <p className="mt-2 text-sm">No service data available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Row: API Response Times + Error Rates */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Response Times */}
        <Card padding="none">
          <div className="border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
              API Response Times
            </h3>
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
              Current latency percentiles from Micrometer
            </p>
          </div>
          <div className="p-4">
            {responseTimesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : responseTimesQuery.isError ? (
              <div className="flex flex-col items-center justify-center py-8 text-secondary-500">
                <ExclamationTriangleIcon className="h-8 w-8 text-danger-400" />
                <p className="mt-2 text-sm">Failed to load response times</p>
              </div>
            ) : responseTimesQuery.data ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="p50 (Median)"
                  value={formatMs(responseTimesQuery.data.p50Ms)}
                  variant="success"
                />
                <MetricCard
                  label="p95"
                  value={formatMs(responseTimesQuery.data.p95Ms)}
                  variant="warning"
                />
                <MetricCard
                  label="p99"
                  value={formatMs(responseTimesQuery.data.p99Ms)}
                  variant="danger"
                />
                <MetricCard
                  label="Mean"
                  value={formatMs(responseTimesQuery.data.meanMs)}
                />
                <MetricCard
                  label="Max"
                  value={formatMs(responseTimesQuery.data.maxMs)}
                  variant={responseTimesQuery.data.maxMs > 2000 ? 'danger' : 'default'}
                />
                <MetricCard
                  label="Total Requests"
                  value={formatNumber(responseTimesQuery.data.totalRequests)}
                />
              </div>
            ) : null}
          </div>
        </Card>

        {/* Error Rates */}
        <Card padding="none">
          <div className="border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
              Error Rates
            </h3>
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
              Current error rate from payment transaction counters
            </p>
          </div>
          <div className="p-4">
            {errorRatesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : errorRatesQuery.isError ? (
              <div className="flex flex-col items-center justify-center py-8 text-secondary-500">
                <ExclamationTriangleIcon className="h-8 w-8 text-danger-400" />
                <p className="mt-2 text-sm">Failed to load error rates</p>
              </div>
            ) : errorRatesQuery.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label="Error Rate"
                    value={formatPercent(errorRatesQuery.data.overallErrorRate)}
                    variant={errorRatesQuery.data.overallErrorRate > 0.05 ? 'danger' : errorRatesQuery.data.overallErrorRate > 0.01 ? 'warning' : 'success'}
                  />
                  <MetricCard
                    label="Total Errors"
                    value={formatNumber(errorRatesQuery.data.totalErrors)}
                    variant={errorRatesQuery.data.totalErrors > 0 ? 'danger' : 'success'}
                  />
                  <MetricCard
                    label="Total Requests"
                    value={formatNumber(errorRatesQuery.data.totalRequests)}
                  />
                </div>
                {errorRatesQuery.data.errorsByType && Object.keys(errorRatesQuery.data.errorsByType).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-secondary-500 dark:text-secondary-400">
                      Errors by Type
                    </p>
                    <div className="space-y-1">
                      {Object.entries(errorRatesQuery.data.errorsByType).map(([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between rounded border border-secondary-100 px-3 py-1.5 text-xs dark:border-secondary-700"
                        >
                          <span className="font-mono text-secondary-700 dark:text-secondary-300">{type}</span>
                          <span className="font-semibold text-danger-600 dark:text-danger-400">{formatNumber(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Kafka Consumer Lag */}
      <Card padding="none">
        <div className="flex items-center gap-2 border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
          <ServerStackIcon className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
          <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Kafka Consumer Lag
          </h2>
        </div>
        <KafkaLagSection
          data={kafkaLagQuery.data}
          loading={kafkaLagQuery.isLoading}
          error={kafkaLagQuery.isError}
        />
      </Card>

      {/* Alerts Panel */}
      <Card padding="none">
        <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
          <div className="flex items-center gap-2">
            <BellAlertIcon className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
              Alerts
            </h2>
            {alerts.length > 0 && (
              <Badge variant="danger" size="sm" rounded>
                {alerts.length}
              </Badge>
            )}
          </div>
        </div>

        <div>
          {alertsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : alertsQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
              <ExclamationTriangleIcon className="h-8 w-8 text-danger-400" />
              <p className="mt-2 text-sm">Failed to load alerts</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-400 dark:text-secondary-500">
              <CheckCircleIcon className="h-8 w-8" />
              <p className="mt-2 text-sm">No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertRow
                key={alert.alertType}
                alert={alert}
                onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                onResolve={(id) => resolveMutation.mutate(id)}
                isAcknowledging={
                  acknowledgeMutation.isPending && acknowledgeMutation.variables === alert.alertType
                }
                isResolving={
                  resolveMutation.isPending && resolveMutation.variables === alert.alertType
                }
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
