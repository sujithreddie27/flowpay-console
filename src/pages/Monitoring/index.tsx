import { useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
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
import { ChartWrapper } from '@/components/charts';
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
  ServiceHealth,
  ServiceStatus,
  MonitoringAlert,
  AlertSeverity,
  KafkaConsumerLagData,
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

type AlertTab = 'active' | 'history';

// ============================================================================
// Helpers
// ============================================================================

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
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

// ============================================================================
// Sub-Components
// ============================================================================

function ServiceStatusIcon({ status }: { status: ServiceStatus }) {
  switch (status) {
    case 'up':
      return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
    case 'degraded':
      return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
    case 'down':
      return <XCircleIcon className="h-5 w-5 text-danger-500" />;
  }
}

function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const map: Record<ServiceStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
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

// ---- Service Health Card ----
function ServiceHealthCard({ service }: { service: ServiceHealth }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-white px-4 py-3 dark:border-secondary-700 dark:bg-secondary-800">
      <div className="flex items-center gap-3">
        <ServiceStatusIcon status={service.status} />
        <div>
          <p className="text-sm font-medium text-secondary-900 dark:text-white">
            {service.name}
          </p>
          {service.latency != null && (
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              Latency: {formatMs(service.latency)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {service.uptime != null && (
          <span className="text-xs text-secondary-500 dark:text-secondary-400">
            {service.uptime.toFixed(2)}% uptime
          </span>
        )}
        <ServiceStatusBadge status={service.status} />
      </div>
    </div>
  );
}

// ---- Alert Severity Badge ----
function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map: Record<AlertSeverity, { variant: 'danger' | 'warning' | 'info'; label: string }> = {
    critical: { variant: 'danger', label: 'Critical' },
    warning: { variant: 'warning', label: 'Warning' },
    info: { variant: 'info', label: 'Info' },
  };
  const { variant, label } = map[severity];
  return <Badge variant={variant} size="sm" rounded>{label}</Badge>;
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
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  isAcknowledging: boolean;
  isResolving: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-secondary-100 px-4 py-3 last:border-b-0 dark:border-secondary-700">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5">
          {alert.severity === 'critical' ? (
            <XCircleIcon className="h-5 w-5 text-danger-500" />
          ) : alert.severity === 'warning' ? (
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
            <AlertSeverityBadge severity={alert.severity} />
          </div>
          <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2">
            {alert.message}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs text-secondary-400 dark:text-secondary-500">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {relativeTime(alert.createdAt)}
            </span>
            <span>Source: {alert.source}</span>
            {alert.metric && (
              <span>
                {alert.metric}: {alert.currentValue ?? '—'} (threshold: {alert.threshold ?? '—'})
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {alert.status === 'active' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAcknowledge(alert.id)}
              isLoading={isAcknowledging}
              disabled={isAcknowledging}
            >
              Acknowledge
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(alert.id)}
              isLoading={isResolving}
              disabled={isResolving}
            >
              Resolve
            </Button>
          </>
        )}
        {alert.status === 'acknowledged' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(alert.id)}
            isLoading={isResolving}
            disabled={isResolving}
          >
            Resolve
          </Button>
        )}
        {alert.status === 'resolved' && (
          <Badge variant="success" size="sm" rounded>Resolved</Badge>
        )}
      </div>
    </div>
  );
}

// ---- Kafka Lag Table ----
function KafkaLagTable({
  data,
  loading,
  error,
}: {
  data?: KafkaConsumerLagData[];
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

  if (!data?.length) {
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
            <th className="px-4 py-2 text-left font-medium text-secondary-600 dark:text-secondary-400">Topic</th>
            <th className="px-4 py-2 text-left font-medium text-secondary-600 dark:text-secondary-400">Consumer Group</th>
            <th className="px-4 py-2 text-right font-medium text-secondary-600 dark:text-secondary-400">Partition</th>
            <th className="px-4 py-2 text-right font-medium text-secondary-600 dark:text-secondary-400">Current Offset</th>
            <th className="px-4 py-2 text-right font-medium text-secondary-600 dark:text-secondary-400">End Offset</th>
            <th className="px-4 py-2 text-right font-medium text-secondary-600 dark:text-secondary-400">Lag</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={`${row.topic}-${row.partition}-${idx}`}
              className="border-b border-secondary-100 last:border-b-0 dark:border-secondary-800"
            >
              <td className="px-4 py-2 font-mono text-xs text-secondary-900 dark:text-white">
                {row.topic}
              </td>
              <td className="px-4 py-2 text-secondary-600 dark:text-secondary-300">
                {row.consumerGroup}
              </td>
              <td className="px-4 py-2 text-right text-secondary-600 dark:text-secondary-300">
                {row.partition}
              </td>
              <td className="px-4 py-2 text-right font-mono text-xs text-secondary-600 dark:text-secondary-300">
                {formatNumber(row.currentOffset)}
              </td>
              <td className="px-4 py-2 text-right font-mono text-xs text-secondary-600 dark:text-secondary-300">
                {formatNumber(row.endOffset)}
              </td>
              <td className="px-4 py-2 text-right">
                <span
                  className={cn(
                    'font-semibold font-mono text-xs',
                    row.lag > 10_000
                      ? 'text-danger-600 dark:text-danger-400'
                      : row.lag > 1_000
                        ? 'text-warning-600 dark:text-warning-400'
                        : 'text-success-600 dark:text-success-400'
                  )}
                >
                  {formatNumber(row.lag)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Chart Tooltips ----
function ResponseTimeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
        {formatTime(label)}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-secondary-600 dark:text-secondary-300">{entry.name}:</span>
          <span className="font-semibold text-secondary-900 dark:text-white">{formatMs(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ErrorRateTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
        {formatTime(label)}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-secondary-600 dark:text-secondary-300">{entry.name}:</span>
          <span className="font-semibold text-secondary-900 dark:text-white">
            {entry.dataKey === 'errorRate' ? formatPercent(entry.value) : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MonitoringPage
// ============================================================================

export function MonitoringPage() {
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30_000);
  const [alertTab, setAlertTab] = useState<AlertTab>('active');
  const [refreshOpen, setRefreshOpen] = useState(false);

  // Queries with configurable auto-refresh
  const healthQuery = useSystemHealth(refreshInterval);
  const responseTimesQuery = useApiResponseTimes({ interval: 'minute' }, refreshInterval);
  const errorRatesQuery = useErrorRates({ interval: 'minute' }, refreshInterval);
  const kafkaLagQuery = useKafkaConsumerLag(refreshInterval);

  const activeAlertsQuery = useMonitoringAlerts(
    { status: alertTab === 'active' ? 'active' : undefined, pageSize: 20 },
    refreshInterval,
  );

  const acknowledgeMutation = useAcknowledgeMonitoringAlert();
  const resolveMutation = useResolveMonitoringAlert();

  const handleRefreshAll = useCallback(() => {
    healthQuery.refetch();
    responseTimesQuery.refetch();
    errorRatesQuery.refetch();
    kafkaLagQuery.refetch();
    activeAlertsQuery.refetch();
  }, [healthQuery, responseTimesQuery, errorRatesQuery, kafkaLagQuery, activeAlertsQuery]);

  const activeAlerts = activeAlertsQuery.data?.items ?? [];
  const activeAlertCount = activeAlerts.filter((a) => a.status === 'active').length;

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
        <OverallStatusBanner status={healthQuery.data.overallStatus} />
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
          {healthQuery.data && (
            <span className="text-xs text-secondary-400 dark:text-secondary-500">
              Last checked: {relativeTime(healthQuery.data.lastCheck)}
            </span>
          )}
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
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {healthQuery.data?.services.map((service) => (
                <ServiceHealthCard key={service.name} service={service} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Charts Row: API Response Times + Error Rate */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Response Time Chart */}
        <ChartWrapper
          title="API Response Times"
          subtitle="p50, p95, p99 latency percentiles"
          loading={responseTimesQuery.isLoading}
          error={responseTimesQuery.isError}
          empty={!responseTimesQuery.data?.length}
          height={300}
        >
          <ResponsiveContainer width="100%" height={268}>
            <LineChart data={responseTimesQuery.data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                className="text-xs"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatMs}
                className="text-xs"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<ResponseTimeTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="p50" name="p50" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p95" name="p95" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p99" name="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Error Rate Chart */}
        <ChartWrapper
          title="Error Rate Trend"
          subtitle="Error rate and error count over time"
          loading={errorRatesQuery.isLoading}
          error={errorRatesQuery.isError}
          empty={!errorRatesQuery.data?.length}
          height={300}
        >
          <ResponsiveContainer width="100%" height={268}>
            <AreaChart data={errorRatesQuery.data}>
              <defs>
                <linearGradient id="errorRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-secondary-200 dark:stroke-secondary-700" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatPercent}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<ErrorRateTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="errorRate"
                name="Error Rate"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#errorRateGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Kafka Consumer Lag */}
      <Card padding="none">
        <div className="flex items-center gap-2 border-b border-secondary-200 px-6 py-4 dark:border-secondary-700">
          <ServerStackIcon className="h-5 w-5 text-secondary-500 dark:text-secondary-400" />
          <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Kafka Consumer Lag
          </h2>
        </div>
        <KafkaLagTable
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
            {activeAlertCount > 0 && (
              <Badge variant="danger" size="sm" rounded>
                {activeAlertCount}
              </Badge>
            )}
          </div>
          <div className="flex rounded-lg border border-secondary-200 dark:border-secondary-700">
            <button
              onClick={() => setAlertTab('active')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-l-lg transition-colors',
                alertTab === 'active'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-secondary-600 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:bg-secondary-800'
              )}
            >
              Active
            </button>
            <button
              onClick={() => setAlertTab('history')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-r-lg transition-colors',
                alertTab === 'history'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-secondary-600 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:bg-secondary-800'
              )}
            >
              History
            </button>
          </div>
        </div>

        <div>
          {activeAlertsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : activeAlertsQuery.isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-500">
              <ExclamationTriangleIcon className="h-8 w-8 text-danger-400" />
              <p className="mt-2 text-sm">Failed to load alerts</p>
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-secondary-400 dark:text-secondary-500">
              <CheckCircleIcon className="h-8 w-8" />
              <p className="mt-2 text-sm">
                {alertTab === 'active' ? 'No active alerts' : 'No alert history available'}
              </p>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                onResolve={(id) => resolveMutation.mutate(id)}
                isAcknowledging={
                  acknowledgeMutation.isPending && acknowledgeMutation.variables === alert.id
                }
                isResolving={
                  resolveMutation.isPending && resolveMutation.variables === alert.id
                }
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
