import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'recharts';
import {
  ShieldCheckIcon,
  UsersIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentMagnifyingGlassIcon,
  ServerStackIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Breadcrumbs } from '@/components';
import { Skeleton, Badge, LiveIndicator } from '@/components/ui';
import { ChartWrapper } from '@/components/charts';
import {
  useAdminDashboardStats,
  useProcessingRate,
  useSystemLatency,
  useTopMerchants,
  useAdminAlerts,
  useAcknowledgeAlert,
} from '@/hooks/useAdmin';
import { useRealtimeDashboard } from '@/hooks';
import { invalidateQueries } from '@/services';
import type {
  AdminDashboardStats,
  ProcessingRateData,
  SystemLatencyData,
  TopMerchant,
  AdminAlert,
} from '@/types';

// ============================================================================
// Formatters
// ============================================================================

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

// ============================================================================
// System Overview Stat Card
// ============================================================================

interface OverviewCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  iconBg: string;
  status?: 'healthy' | 'degraded' | 'down';
  loading?: boolean;
}

function OverviewCard({ label, value, subValue, icon: Icon, iconBg, status, loading }: OverviewCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
          <Skeleton variant="text" width={48} height={16} />
        </div>
        <Skeleton variant="text" width="60%" height={14} className="mt-4" />
        <Skeleton variant="text" width="40%" height={28} className="mt-2" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    healthy: 'text-success-600 dark:text-success-400',
    degraded: 'text-warning-600 dark:text-warning-400',
    down: 'text-danger-600 dark:text-danger-400',
  };

  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {status && (
          <span className={`text-xs font-semibold uppercase tracking-wide ${statusColors[status] ?? ''}`}>
            {status}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-secondary-500 dark:text-secondary-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-secondary-900 dark:text-white">
        {value}
      </p>
      {subValue && (
        <p className="mt-0.5 text-xs text-secondary-400 dark:text-secondary-500">
          {subValue}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Processing Rate Chart
// ============================================================================

interface ProcessingRateChartProps {
  data: ProcessingRateData[];
  loading?: boolean;
  error?: boolean;
}

function ProcessingRateTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
        {formatTime(label)}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-secondary-600 dark:text-secondary-300 capitalize">
            {entry.dataKey === 'rate' ? 'TPS' : entry.dataKey === 'successRate' ? 'Success' : 'Failure'}:
          </span>
          <span className="font-semibold text-secondary-900 dark:text-white">
            {entry.dataKey === 'rate' ? `${entry.value}/s` : `${entry.value.toFixed(1)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProcessingRateChart({ data, loading, error }: ProcessingRateChartProps) {
  return (
    <ChartWrapper
      title="Transaction Processing Rate"
      subtitle="Real-time transactions per second"
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      height={320}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}/s`}
          />
          <Tooltip content={<ProcessingRateTooltip />} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#rateGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ============================================================================
// System Latency Chart
// ============================================================================

interface SystemLatencyChartProps {
  data: SystemLatencyData[];
  loading?: boolean;
  error?: boolean;
}

function LatencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-secondary-200 bg-white px-4 py-3 shadow-lg dark:border-secondary-700 dark:bg-secondary-800">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
        {formatTime(label)}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-secondary-600 dark:text-secondary-300 uppercase">
            {entry.dataKey}:
          </span>
          <span className="font-semibold text-secondary-900 dark:text-white">
            {entry.value}ms
          </span>
        </div>
      ))}
    </div>
  );
}

function SystemLatencyChart({ data, loading, error }: SystemLatencyChartProps) {
  return (
    <ChartWrapper
      title="System Latency"
      subtitle="API response times (p50, p95, p99)"
      loading={loading}
      error={error}
      empty={!loading && !error && data.length === 0}
      height={320}
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip content={<LatencyTooltip />} />
          <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400">
          <span className="inline-block h-2 w-2 rounded-full bg-success-500" /> p50
        </div>
        <div className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400">
          <span className="inline-block h-2 w-2 rounded-full bg-warning-500" /> p95
        </div>
        <div className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400">
          <span className="inline-block h-2 w-2 rounded-full bg-danger-500" /> p99
        </div>
      </div>
    </ChartWrapper>
  );
}

// ============================================================================
// Top Merchants Table
// ============================================================================

interface TopMerchantsTableProps {
  merchants: TopMerchant[];
  loading?: boolean;
}

function TopMerchantsTable({ merchants, loading }: TopMerchantsTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <div className="border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
          <Skeleton variant="text" width="40%" height={18} />
        </div>
        <div className="divide-y divide-secondary-100 dark:divide-secondary-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={120} height={14} />
              </div>
              <Skeleton variant="text" width={80} height={14} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
      <div className="border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
        <h2 className="text-base font-semibold text-secondary-900 dark:text-white">
          Top Merchants by Volume
        </h2>
      </div>
      {merchants.length === 0 ? (
        <div className="p-10 text-center">
          <UserGroupIcon className="mx-auto h-10 w-10 text-secondary-300 dark:text-secondary-600" />
          <p className="mt-3 text-sm text-secondary-500 dark:text-secondary-400">
            No merchant data available.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                  Merchant
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                  Volume
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                  Transactions
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
              {merchants.map((merchant, idx) => (
                <tr
                  key={merchant.id}
                  className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-400 dark:text-secondary-500">
                    {idx + 1}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-medium text-secondary-900 dark:text-white">
                      {merchant.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                      {formatCurrency(merchant.volume, merchant.currency)}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell whitespace-nowrap px-6 py-4 text-right text-sm text-secondary-600 dark:text-secondary-300">
                    {formatNumber(merchant.transactionCount)}
                  </td>
                  <td className="hidden md:table-cell whitespace-nowrap px-6 py-4 text-right">
                    <span
                      className={`text-sm font-medium ${
                        merchant.successRate >= 98
                          ? 'text-success-600 dark:text-success-400'
                          : merchant.successRate >= 95
                            ? 'text-warning-600 dark:text-warning-400'
                            : 'text-danger-600 dark:text-danger-400'
                      }`}
                    >
                      {merchant.successRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Active Alerts Panel
// ============================================================================

interface AlertsPanelProps {
  alerts: AdminAlert[];
  loading?: boolean;
  onAcknowledge: (alertId: string) => void;
  acknowledging?: boolean;
}

function AlertsPanel({ alerts, loading, onAcknowledge, acknowledging }: AlertsPanelProps) {
  const severityConfig: Record<string, { icon: React.ElementType; variant: 'danger' | 'warning' | 'info' }> = {
    critical: { icon: XCircleIcon, variant: 'danger' },
    warning: { icon: ExclamationTriangleIcon, variant: 'warning' },
    info: { icon: CheckCircleIcon, variant: 'info' },
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <div className="border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
          <Skeleton variant="text" width="40%" height={18} />
        </div>
        <div className="divide-y divide-secondary-100 dark:divide-secondary-700">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <Skeleton variant="text" width="70%" height={14} />
              <Skeleton variant="text" width="90%" height={12} className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
      <div className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
        <h2 className="text-base font-semibold text-secondary-900 dark:text-white">
          Active Alerts
        </h2>
        <Badge variant="danger" size="sm" rounded>
          {alerts.length}
        </Badge>
      </div>
      {alerts.length === 0 ? (
        <div className="p-10 text-center">
          <CheckCircleIcon className="mx-auto h-10 w-10 text-success-300 dark:text-success-600" />
          <p className="mt-3 text-sm font-medium text-secondary-500 dark:text-secondary-400">
            No active alerts
          </p>
          <p className="mt-1 text-xs text-secondary-400 dark:text-secondary-500">
            All systems are operating normally.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-secondary-100 dark:divide-secondary-700 max-h-96 overflow-y-auto">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] ?? severityConfig.info;
            const AlertIcon = config.icon;
            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-6 py-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
              >
                <AlertIcon
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    config.variant === 'danger'
                      ? 'text-danger-500'
                      : config.variant === 'warning'
                        ? 'text-warning-500'
                        : 'text-primary-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                      {alert.title}
                    </p>
                    <Badge variant={config.variant} size="sm" rounded>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2">
                    {alert.message}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-secondary-400 dark:text-secondary-500">
                      {formatDateTime(alert.createdAt)}
                    </span>
                    {!alert.acknowledged && (
                      <button
                        type="button"
                        onClick={() => onAcknowledge(alert.id)}
                        disabled={acknowledging}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Quick Links
// ============================================================================

const adminQuickLinks = [
  {
    label: 'User Management',
    description: 'View and manage all users',
    href: '/admin/users',
    icon: UsersIcon,
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    iconColor: 'text-primary-600 dark:text-primary-400',
  },
  {
    label: 'All Transactions',
    description: 'View system-wide transactions',
    href: '/admin/transactions',
    icon: DocumentMagnifyingGlassIcon,
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    iconColor: 'text-success-600 dark:text-success-400',
  },
  {
    label: 'System Monitoring',
    description: 'Service health & metrics',
    href: '/monitoring',
    icon: ServerStackIcon,
    iconBg: 'bg-warning-100 dark:bg-warning-900/30',
    iconColor: 'text-warning-600 dark:text-warning-400',
  },
  {
    label: 'Settings',
    description: 'System configuration',
    href: '/settings',
    icon: Cog6ToothIcon,
    iconBg: 'bg-secondary-100 dark:bg-secondary-700',
    iconColor: 'text-secondary-600 dark:text-secondary-300',
  },
];

function AdminQuickLinks() {
  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 p-6">
      <h2 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">
        Quick Links
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {adminQuickLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="flex items-center gap-3 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${link.iconBg}`}>
              <link.icon className={`h-4.5 w-4.5 ${link.iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-900 dark:text-white">
                {link.label}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Admin Dashboard Page
// ============================================================================

export const AdminDashboardPage = () => {
  const [merchantPeriod, setMerchantPeriod] = useState<'today' | 'week' | 'month'>('week');

  // Data fetching hooks
  const { data: stats, isLoading: statsLoading, isError: statsError } = useAdminDashboardStats();
  const { data: processingRateData, isLoading: prLoading, isError: prError } = useProcessingRate({ interval: 'minute' });
  const { data: latencyData, isLoading: latLoading, isError: latError } = useSystemLatency({ interval: 'minute' });
  const { data: merchants, isLoading: merchantsLoading } = useTopMerchants({ limit: 10, period: merchantPeriod });
  const { data: alertsData, isLoading: alertsLoading } = useAdminAlerts({ acknowledged: false, pageSize: 20 });
  const acknowledgeAlert = useAcknowledgeAlert();

  // Real-time WebSocket connection
  const { status: wsStatus } = useRealtimeDashboard({
    onNewTransaction: () => {
      invalidateQueries.admin();
    },
  });

  const overviewCards = buildOverviewCards(stats);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-secondary-500 dark:text-secondary-400">
              System-wide overview and management
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => invalidateQueries.admin()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 dark:border-secondary-700 px-3 py-1.5 text-xs font-medium text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Refresh
          </button>
          <LiveIndicator status={wsStatus} />
        </div>
      </div>

      {/* Error State */}
      {statsError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20 p-4">
          <p className="text-sm text-danger-700 dark:text-danger-400">
            Failed to load admin dashboard statistics. Please try refreshing.
          </p>
        </div>
      )}

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <OverviewCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Charts: Processing Rate + System Latency */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProcessingRateChart
          data={processingRateData ?? []}
          loading={prLoading}
          error={prError}
        />
        <SystemLatencyChart
          data={latencyData ?? []}
          loading={latLoading}
          error={latError}
        />
      </div>

      {/* Bottom Grid: Top Merchants + Alerts + Quick Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Merchants — spans 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1 rounded-lg border border-secondary-200 dark:border-secondary-700 p-0.5">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setMerchantPeriod(period)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    merchantPeriod === period
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <TopMerchantsTable
            merchants={merchants ?? []}
            loading={merchantsLoading}
          />
        </div>

        {/* Sidebar: Alerts + Quick Links */}
        <div className="space-y-6">
          <AlertsPanel
            alerts={alertsData?.items ?? []}
            loading={alertsLoading}
            onAcknowledge={(id) => acknowledgeAlert.mutate(id)}
            acknowledging={acknowledgeAlert.isPending}
          />
          <AdminQuickLinks />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Helpers
// ============================================================================

function buildOverviewCards(stats?: AdminDashboardStats): OverviewCardProps[] {
  if (!stats) {
    return [
      { label: 'Total Users', value: '--', icon: UsersIcon, iconBg: 'bg-primary-500' },
      { label: 'Transactions Today', value: '--', icon: BoltIcon, iconBg: 'bg-success-500' },
      { label: 'System Health', value: '--', icon: ServerStackIcon, iconBg: 'bg-warning-500' },
      { label: 'Active Alerts', value: '--', icon: ExclamationTriangleIcon, iconBg: 'bg-danger-500' },
    ];
  }

  return [
    {
      label: 'Total Users',
      value: formatNumber(stats.totalUsers),
      subValue: `${formatNumber(stats.activeUsers)} active`,
      icon: UsersIcon,
      iconBg: 'bg-primary-500',
    },
    {
      label: 'Transactions Today',
      value: formatNumber(stats.transactionsToday),
      subValue: `Volume: ${formatCurrency(stats.totalVolumeToday, stats.totalVolumeCurrency)}`,
      icon: BoltIcon,
      iconBg: 'bg-success-500',
    },
    {
      label: 'System Health',
      value: stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1),
      subValue: `${formatNumber(stats.pendingTransactions)} pending`,
      icon: ServerStackIcon,
      iconBg: stats.systemHealth === 'healthy' ? 'bg-success-500' : stats.systemHealth === 'degraded' ? 'bg-warning-500' : 'bg-danger-500',
      status: stats.systemHealth,
    },
    {
      label: 'Active Alerts',
      value: formatNumber(stats.activeAlerts),
      subValue: `${formatNumber(stats.failedTransactionsToday)} failed today`,
      icon: ExclamationTriangleIcon,
      iconBg: stats.activeAlerts > 0 ? 'bg-danger-500' : 'bg-success-500',
    },
  ];
}
