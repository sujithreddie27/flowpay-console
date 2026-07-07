import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useDashboardStats, useRecentTransactions, useDashboardCharts, useRealtimeDashboard } from '@/hooks';
import { Skeleton, StatusBadge, LiveIndicator, useToast } from '@/components/ui';
import {
  TransactionVolumeChart,
  StatusDistributionChart,
  RevenueByDayChart,
  DateRangePicker,
  useDateRange,
} from '@/components/charts';
import { invalidateQueries } from '@/services';
import type { Transaction, DashboardStats } from '@/types';
import type { RealtimeTransaction } from '@/hooks/useWebSocket';

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

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  iconBg: string;
  loading?: boolean;
}

function StatCard({ label, value, change, icon: Icon, iconBg, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <div className="flex items-center justify-between">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
          <Skeleton variant="text" width={48} height={16} />
        </div>
        <Skeleton variant="text" width="60%" height={14} className="mt-4" />
        <Skeleton variant="text" width="40%" height={32} className="mt-2" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 p-6 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {change !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium ${
              isPositive
                ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                : 'bg-danger-50 text-danger-700 dark:bg-danger-900/20 dark:text-danger-400'
            }`}
          >
            {isPositive ? (
              <ArrowTrendingUpIcon className="h-3 w-3" />
            ) : (
              <ArrowTrendingDownIcon className="h-3 w-3" />
            )}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-secondary-500 dark:text-secondary-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-secondary-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// Recent Transactions Table
// ============================================================================

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading: boolean;
}

function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
        <div className="border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
          <Skeleton variant="text" width="30%" height={20} />
        </div>
        <div className="divide-y divide-secondary-100 dark:divide-secondary-700">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={36} height={36} />
                <div>
                  <Skeleton variant="text" width={140} height={14} />
                  <Skeleton variant="text" width={100} height={12} className="mt-1" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton variant="text" width={80} height={14} />
                <Skeleton variant="text" width={60} height={12} className="mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 p-10 text-center">
        <BanknotesIcon className="mx-auto h-10 w-10 text-secondary-300 dark:text-secondary-600" />
        <p className="mt-3 text-sm font-medium text-secondary-500 dark:text-secondary-400">
          No recent transactions
        </p>
        <p className="mt-1 text-xs text-secondary-400 dark:text-secondary-500">
          Transactions will appear here once processed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700">
      <div className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
        <h2 className="text-base font-semibold text-secondary-900 dark:text-white">
          Recent Transactions
        </h2>
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          View all
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full">
          <thead className="bg-secondary-50 dark:bg-secondary-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400 sm:px-6">
                Transaction
              </th>
              <th className="hidden xs:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400 sm:px-6">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400 sm:px-6">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400 sm:px-6">
                Amount
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors"
              >
                <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                  <Link
                    to={`/transactions/${txn.id}`}
                    className="text-sm font-medium text-secondary-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {txn.referenceId}
                  </Link>
                  {txn.recipient && (
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                      {txn.recipient.name}
                    </p>
                  )}
                </td>
                <td className="hidden xs:table-cell whitespace-nowrap px-4 py-4 sm:px-6">
                  <span className="inline-flex items-center text-xs font-medium capitalize text-secondary-700 dark:text-secondary-300">
                    {txn.type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                  <StatusBadge status={txn.status as any} size="sm" dot rounded />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                  <span
                    className={`text-sm font-semibold ${
                      txn.type === 'credit' || txn.type === 'refund'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-secondary-900 dark:text-white'
                    }`}
                  >
                    {txn.type === 'credit' || txn.type === 'refund' ? '+' : '-'}
                    {formatCurrency(txn.amount, txn.currency)}
                  </span>
                </td>
                <td className="hidden sm:table-cell whitespace-nowrap px-6 py-4 text-right text-xs text-secondary-500 dark:text-secondary-400">
                  {formatDate(txn.initiatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Quick Actions
// ============================================================================

function QuickActions() {
  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 p-6">
      <h2 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to="/payments/new"
          className="flex items-center gap-3 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <PlusIcon className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900 dark:text-white">
              New Payment
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              Initiate a new transaction
            </p>
          </div>
        </Link>
        <Link
          to="/transactions"
          className="flex items-center gap-3 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-700">
            <CreditCardIcon className="h-4.5 w-4.5 text-secondary-600 dark:text-secondary-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900 dark:text-white">
              All Transactions
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              View full transaction history
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// Dashboard Page
// ============================================================================

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: recentData, isLoading: txnLoading } = useRecentTransactions(10);
  const toast = useToast();

  const { range, setRange } = useDateRange('30d');
  const {
    data: chartData,
    isLoading: chartsLoading,
    isError: chartsError,
  } = useDashboardCharts({
    fromDate: range.fromDate,
    toDate: range.toDate,
  });

  // Real-time WebSocket connection for live transaction updates
  const { status: wsStatus } = useRealtimeDashboard({
    onNewTransaction: (update: RealtimeTransaction) => {
      // Show toast notification for new transactions
      const toastType = update.status === 'completed'
        ? 'success'
        : update.status === 'failed'
          ? 'error'
          : 'info';

      toast[toastType](
        `Transaction ${update.status}`,
        update.referenceId
          ? `${update.referenceId} — ${update.message}`
          : update.message
      );

      // Invalidate dashboard queries to refresh stats
      invalidateQueries.dashboard();
      invalidateQueries.transactions();
    },
  });

  const statCards = buildStatCards(stats);

  const dateRangeAction = (
    <DateRangePicker value={range} onChange={setRange} />
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Overview of your payment processing activity.
          </p>
        </div>
        <LiveIndicator status={wsStatus} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Error State */}
      {statsError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20 p-4">
          <p className="text-sm text-danger-700 dark:text-danger-400">
            Failed to load dashboard statistics. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Transaction Volume — full width */}
        <TransactionVolumeChart
          data={chartData?.volumeData ?? []}
          loading={chartsLoading}
          error={chartsError}
          headerAction={dateRangeAction}
        />

        {/* Status Distribution + Revenue — side by side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusDistributionChart
            data={chartData?.statusDistribution ?? []}
            loading={chartsLoading}
            error={chartsError}
          />
          <RevenueByDayChart
            data={chartData?.revenueData ?? []}
            loading={chartsLoading}
            error={chartsError}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Transactions - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={recentData ?? []}
            loading={txnLoading}
          />
        </div>

        {/* Sidebar: Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function buildStatCards(stats?: DashboardStats): StatCardProps[] {
  if (!stats) {
    return [
      { label: 'Total Transactions', value: '--', icon: ChartBarIcon, iconBg: 'bg-primary-500' },
      { label: 'Volume Processed', value: '--', icon: BanknotesIcon, iconBg: 'bg-success-500' },
      { label: 'Success Rate', value: '--', icon: ArrowTrendingUpIcon, iconBg: 'bg-warning-500' },
      { label: 'Active Accounts', value: '--', icon: UserGroupIcon, iconBg: 'bg-secondary-500' },
    ];
  }

  const monthTxn = stats.totalTransactions.month;
  const weekTxn = stats.totalTransactions.week;
  const txnChange = weekTxn > 0 ? ((monthTxn - weekTxn * 4) / (weekTxn * 4)) * 100 : 0;

  return [
    {
      label: 'Total Transactions',
      value: formatNumber(stats.totalTransactions.month),
      change: txnChange,
      icon: ChartBarIcon,
      iconBg: 'bg-primary-500',
    },
    {
      label: 'Volume Processed',
      value: formatCurrency(stats.totalVolume.month, stats.totalVolume.currency),
      icon: BanknotesIcon,
      iconBg: 'bg-success-500',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate.month.toFixed(1)}%`,
      change: stats.successRate.month - stats.successRate.week,
      icon: ArrowTrendingUpIcon,
      iconBg: 'bg-warning-500',
    },
    {
      label: 'Active Accounts',
      value: formatNumber(stats.activeAccounts),
      icon: UserGroupIcon,
      iconBg: 'bg-secondary-500',
    },
  ];
}
