import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useAppSelector } from '@/store';
import {
  CreditCardIcon,
  PlusIcon,
  BanknotesIcon,
  WalletIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Breadcrumbs } from '@/components';
import {
  Card,
  CardBody,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  LoadingSpinner,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import {
  useAccounts,
  useAccount,
  useAccountBalance,
  useAccountBalanceHistory,
  useAccountTransactions,
  useCreateAccount,
  useFreezeAccount,
  useUnfreezeAccount,
  useDeleteAccount,
} from '@/hooks';
import type { Account, CreateAccountRequest, TransactionStatus } from '@/types';
import { cn } from '@/utils';

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function getAccountIcon(type: Account['accountType']) {
  switch (type) {
    case 'savings':
      return <BuildingLibraryIcon className="h-6 w-6" />;
    case 'current':
      return <BanknotesIcon className="h-6 w-6" />;
    case 'wallet':
      return <WalletIcon className="h-6 w-6" />;
    default:
      return <CreditCardIcon className="h-6 w-6" />;
  }
}

function getAccountTypeLabel(type: Account['accountType']): string {
  switch (type) {
    case 'savings':
      return 'Savings Account';
    case 'current':
      return 'Current Account';
    case 'wallet':
      return 'Digital Wallet';
    default:
      return 'Account';
  }
}

function getStatusVariant(status: Account['status']): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'active':
      return 'success';
    case 'frozen':
      return 'warning';
    case 'closed':
      return 'danger';
    default:
      return 'success';
  }
}

function getTransactionStatusVariant(status: TransactionStatus): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
    case 'reversed':
      return 'warning';
    case 'failed':
    case 'cancelled':
      return 'danger';
    case 'processing':
      return 'info';
    default:
      return 'secondary';
  }
}

// ============================================================================
// AccountsPage Entry Point
// ============================================================================

export const AccountsPage = () => {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <AccountDetailView accountId={id} />;
  }

  return <AccountsListView />;
};

// ============================================================================
// Accounts List View
// ============================================================================

function AccountsListView() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<Account['status'] | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, isError, refetch } = useAccounts({
    status: filterStatus,
    pageSize: 50,
  });

  const accounts = data?.items ?? [];

  return (
    <div className="p-6">
      <Breadcrumbs />

      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <CreditCardIcon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                Accounts
              </h1>
            </div>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm">
              Manage your payment accounts and balances
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              New Account
            </Button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 mb-6">
          {([undefined, 'active', 'frozen', 'closed'] as const).map((status) => (
            <button
              key={status ?? 'all'}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                filterStatus === status
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800'
              )}
            >
              {status === undefined ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <AccountsGridSkeleton />
        ) : isError ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<XCircleIcon className="h-8 w-8" />}
                title="Failed to load accounts"
                description="An error occurred while fetching your accounts. Please try again."
                action={{ label: 'Retry', onClick: () => refetch() }}
              />
            </CardBody>
          </Card>
        ) : accounts.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={<CreditCardIcon className="h-8 w-8" />}
                title="No accounts found"
                description={
                  filterStatus
                    ? `No ${filterStatus} accounts found. Try a different filter.`
                    : 'Create your first account to get started with payments.'
                }
                action={{
                  label: 'Create Account',
                  onClick: () => setShowCreateModal(true),
                }}
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onClick={() => navigate(`/accounts/${account.id}`)}
              />
            ))}
          </div>
        )}

        {/* Summary Bar */}
        {!isLoading && accounts.length > 0 && (
          <div className="mt-8 rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-200 dark:border-secondary-700 p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryItem
                label="Total Accounts"
                value={String(accounts.length)}
              />
              <SummaryItem
                label="Active"
                value={String(accounts.filter((a) => a.status === 'active').length)}
              />
              <SummaryItem
                label="Total Balance"
                value={formatCurrency(
                  accounts.reduce((sum, a) => sum + a.balance, 0),
                  accounts[0]?.currency ?? 'USD'
                )}
              />
              <SummaryItem
                label="Available Balance"
                value={formatCurrency(
                  accounts.reduce((sum, a) => sum + a.availableBalance, 0),
                  accounts[0]?.currency ?? 'USD'
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}

// ============================================================================
// Account Card
// ============================================================================

interface AccountCardProps {
  account: Account;
  onClick: () => void;
}

function AccountCard({ account, onClick }: AccountCardProps) {
  const statusVariant = getStatusVariant(account.status);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-5 transition-all duration-200 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center h-10 w-10 rounded-lg',
            account.status === 'active'
              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : account.status === 'frozen'
              ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
              : 'bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-500'
          )}>
            {getAccountIcon(account.accountType)}
          </div>
          <div>
            <p className="text-sm font-semibold text-secondary-900 dark:text-white">
              {getAccountTypeLabel(account.accountType)}
            </p>
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              •••• {account.accountNumber.slice(-4)}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant} size="sm" dot rounded>
          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
        </Badge>
      </div>

      <div className="mb-4">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-0.5">
          Balance
        </p>
        <p className="text-xl font-bold text-secondary-900 dark:text-white">
          {formatCurrency(account.balance, account.currency)}
        </p>
        {account.availableBalance !== account.balance && (
          <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-0.5">
            Available: {formatCurrency(account.availableBalance, account.currency)}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-secondary-100 dark:border-secondary-800">
        <p className="text-xs text-secondary-400 dark:text-secondary-500">
          {account.lastActivityAt
            ? `Last activity ${formatRelativeTime(account.lastActivityAt)}`
            : `Created ${formatDate(account.createdAt)}`}
        </p>
        <ChevronRightIcon className="h-4 w-4 text-secondary-400 dark:text-secondary-500 group-hover:text-primary-500 transition-colors" />
      </div>
    </button>
  );
}

// ============================================================================
// Account Detail View
// ============================================================================

interface AccountDetailViewProps {
  accountId: string;
}

function AccountDetailView({ accountId }: AccountDetailViewProps) {
  const navigate = useNavigate();
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [historyInterval, setHistoryInterval] = useState<'day' | 'week' | 'month'>('day');

  const { data: account, isLoading, isError } = useAccount(accountId);
  const { data: balanceData } = useAccountBalance(accountId);
  const { data: balanceHistory, isLoading: historyLoading } = useAccountBalanceHistory(
    accountId,
    { interval: historyInterval }
  );
  const { data: transactionsData, isLoading: txLoading } = useAccountTransactions(
    accountId,
    { page: 1, pageSize: 10 }
  );
  const { data: allAccountsData } = useAccounts({ pageSize: 50 });
  const freezeAccount = useFreezeAccount();
  const unfreezeAccount = useUnfreezeAccount();
  const deleteAccount = useDeleteAccount();

  const otherAccounts = (allAccountsData?.items ?? []).filter((a) => a.id !== accountId);

  const handleFreeze = useCallback(() => {
    freezeAccount.mutate(
      { accountId, reason: 'User-initiated freeze' },
      { onSuccess: () => setShowFreezeModal(false) }
    );
  }, [accountId, freezeAccount]);

  const handleUnfreeze = useCallback(() => {
    unfreezeAccount.mutate(accountId);
  }, [accountId, unfreezeAccount]);

  const handleClose = useCallback(() => {
    deleteAccount.mutate(accountId, {
      onSuccess: () => {
        setShowCloseModal(false);
        navigate('/accounts');
      },
    });
  }, [accountId, deleteAccount, navigate]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Breadcrumbs />
        <div className="max-w-6xl mx-auto">
          <AccountDetailSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="p-6">
        <Breadcrumbs />
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardBody>
              <EmptyState
                icon={<XCircleIcon className="h-8 w-8" />}
                title="Account not found"
                description="The account you're looking for doesn't exist or has been removed."
                action={{ label: 'Back to Accounts', onClick: () => navigate('/accounts') }}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const transactions = transactionsData?.items ?? [];

  return (
    <div className="p-6">
      <Breadcrumbs />

      <div className="max-w-6xl mx-auto">
        {/* Back Button & Account Switcher */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/accounts')}
              className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Accounts
            </button>

            {/* Account Switcher */}
            {otherAccounts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white bg-secondary-100 dark:bg-secondary-800 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  Switch Account
                </button>
                {showAccountSwitcher && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAccountSwitcher(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 shadow-lg z-20 py-2 max-h-80 overflow-y-auto">
                      <p className="px-4 py-1.5 text-xs font-medium text-secondary-400 dark:text-secondary-500 uppercase tracking-wide">
                        Switch to
                      </p>
                      {otherAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setShowAccountSwitcher(false);
                            navigate(`/accounts/${acc.id}`);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors text-left"
                        >
                          <div className={cn(
                            'flex items-center justify-center h-8 w-8 rounded-lg flex-shrink-0',
                            acc.status === 'active'
                              ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-500'
                          )}>
                            {getAccountIcon(acc.accountType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                              {getAccountTypeLabel(acc.accountType)}
                            </p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">
                              •••• {acc.accountNumber.slice(-4)} · {formatCurrency(acc.balance, acc.currency)}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(acc.status)} size="sm" rounded>
                            {acc.status.charAt(0).toUpperCase() + acc.status.slice(1)}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex items-center justify-center h-12 w-12 rounded-xl',
                account.status === 'active'
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : account.status === 'frozen'
                  ? 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400'
                  : 'bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-500'
              )}>
                {getAccountIcon(account.accountType)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-secondary-900 dark:text-white">
                  {getAccountTypeLabel(account.accountType)}
                </h1>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  Account •••• {account.accountNumber.slice(-4)}
                </p>
              </div>
              <Badge variant={getStatusVariant(account.status)} size="sm" dot rounded>
                {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
              </Badge>
            </div>

            {/* Account Actions */}
            <div className="flex items-center gap-2">
              {account.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFreezeModal(true)}
                  leftIcon={<LockClosedIcon className="h-4 w-4" />}
                >
                  Freeze
                </Button>
              )}
              {account.status === 'frozen' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnfreeze}
                  isLoading={unfreezeAccount.isPending}
                  leftIcon={<LockOpenIcon className="h-4 w-4" />}
                >
                  Unfreeze
                </Button>
              )}
              {account.status !== 'closed' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowCloseModal(true)}
                  leftIcon={<XCircleIcon className="h-4 w-4" />}
                >
                  Close Account
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-5">
            <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wide mb-1">
              Current Balance
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {formatCurrency(balanceData?.balance ?? account.balance, account.currency)}
            </p>
          </div>
          <div className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-5">
            <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wide mb-1">
              Available Balance
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {formatCurrency(
                balanceData?.availableBalance ?? account.availableBalance,
                account.currency
              )}
            </p>
          </div>
          <div className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-5">
            <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wide mb-1">
              Currency
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-white">
              {account.currency}
            </p>
          </div>
        </div>

        {/* Balance History Chart */}
        <div className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 mb-6">
          <div className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                Balance History
              </h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                Track your account balance over time
              </p>
            </div>
            <div className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-0.5">
              {(['day', 'week', 'month'] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setHistoryInterval(interval)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    historyInterval === interval
                      ? 'bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white shadow-sm'
                      : 'text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
                  )}
                >
                  {interval.charAt(0).toUpperCase() + interval.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6" style={{ minHeight: 280 }}>
            {historyLoading ? (
              <div className="flex items-center justify-center h-60">
                <LoadingSpinner size="lg" />
              </div>
            ) : !balanceHistory || balanceHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-secondary-400">
                <ArrowTrendingUpIcon className="h-10 w-10 mb-2" />
                <p className="text-sm">No balance history available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={balanceHistory} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatCurrency(v, account.currency)}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<BalanceTooltip currency={account.currency} />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 mb-6">
          <div className="flex items-center justify-between border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                Recent Transactions
              </h3>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                Last 10 transactions for this account
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/transactions?accountId=${accountId}`)}
            >
              View All
            </Button>
          </div>
          <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {txLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <Skeleton variant="circular" width={36} height={36} />
                  <div className="flex-1">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="30%" className="mt-1" />
                  </div>
                  <Skeleton variant="text" width={80} />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <ClockIcon className="h-8 w-8 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  No transactions yet
                </p>
              </div>
            ) : (
              transactions.map((tx: any) => (
                <button
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors text-left"
                >
                  <div className={cn(
                    'flex items-center justify-center h-9 w-9 rounded-full flex-shrink-0',
                    tx.type === 'credit' || tx.type === 'refund'
                      ? 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400'
                      : 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400'
                  )}>
                    {tx.type === 'credit' || tx.type === 'refund' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                      {tx.description || `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction`}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                      {formatRelativeTime(tx.initiatedAt || tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-sm font-semibold',
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-secondary-900 dark:text-white'
                    )}>
                      {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <Badge
                      variant={getTransactionStatusVariant(tx.status)}
                      size="sm"
                      rounded
                      className="mt-1"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700">
          <div className="border-b border-secondary-100 dark:border-secondary-700 px-6 py-4">
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
              Account Details
            </h3>
          </div>
          <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
            <DetailRow label="Account Number" value={account.accountNumber} />
            <DetailRow label="Account Type" value={getAccountTypeLabel(account.accountType)} />
            <DetailRow label="Status" value={account.status.charAt(0).toUpperCase() + account.status.slice(1)} />
            <DetailRow label="Currency" value={account.currency} />
            <DetailRow label="Created" value={formatDate(account.createdAt)} />
            <DetailRow label="Last Updated" value={formatDate(account.updatedAt)} />
            {account.lastActivityAt && (
              <DetailRow label="Last Activity" value={formatRelativeTime(account.lastActivityAt)} />
            )}
          </div>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      <Modal isOpen={showFreezeModal} onClose={() => setShowFreezeModal(false)} size="sm">
        <ModalHeader>Freeze Account</ModalHeader>
        <ModalBody>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 mb-4">
            <LockClosedIcon className="h-5 w-5 text-warning-600 dark:text-warning-400 flex-shrink-0" />
            <p className="text-sm text-warning-700 dark:text-warning-300">
              Freezing this account will prevent all transactions until unfrozen.
            </p>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Are you sure you want to freeze account •••• {account.accountNumber.slice(-4)}?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setShowFreezeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleFreeze}
            isLoading={freezeAccount.isPending}
            leftIcon={<LockClosedIcon className="h-4 w-4" />}
          >
            Freeze Account
          </Button>
        </ModalFooter>
      </Modal>

      {/* Close Confirmation Modal */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} size="sm">
        <ModalHeader>Close Account</ModalHeader>
        <ModalBody>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 mb-4">
            <XCircleIcon className="h-5 w-5 text-danger-600 dark:text-danger-400 flex-shrink-0" />
            <p className="text-sm text-danger-700 dark:text-danger-300">
              This action is permanent and cannot be undone.
            </p>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Closing this account will permanently remove it. Any remaining balance must be transferred first.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={() => setShowCloseModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleClose}
            isLoading={deleteAccount.isPending}
            leftIcon={<XCircleIcon className="h-4 w-4" />}
          >
            Close Account
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ============================================================================
// Create Account Modal
// ============================================================================

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  const [accountType, setAccountType] = useState<CreateAccountRequest['accountType']>('savings');
  const [currency, setCurrency] = useState('USD');
  const createAccount = useCreateAccount();
  const user = useAppSelector((state) => state.auth.user);

  const handleSubmit = () => {
    createAccount.mutate(
      { accountType, currency, userId: user?.id },
      {
        onSuccess: () => {
          onClose();
          setAccountType('savings');
          setCurrency('USD');
        },
      }
    );
  };

  const accountTypes: { value: CreateAccountRequest['accountType']; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'savings',
      label: 'Savings Account',
      description: 'Earn interest on your deposits with limited withdrawals.',
      icon: <BuildingLibraryIcon className="h-6 w-6" />,
    },
    {
      value: 'current',
      label: 'Current Account',
      description: 'For daily transactions and unlimited withdrawals.',
      icon: <BanknotesIcon className="h-6 w-6" />,
    },
    {
      value: 'wallet',
      label: 'Digital Wallet',
      description: 'Quick access to funds for instant payments.',
      icon: <WalletIcon className="h-6 w-6" />,
    },
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>Create New Account</ModalHeader>
      <ModalBody>
        {/* Account Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Account Type
          </label>
          <div className="space-y-3">
            {accountTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setAccountType(type.value)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                  accountType === type.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 dark:border-primary-400'
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0',
                  accountType === type.value
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400'
                )}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-semibold',
                    accountType === type.value
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-secondary-900 dark:text-white'
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
                    {type.description}
                  </p>
                </div>
                {accountType === type.value && (
                  <CheckCircleIcon className="h-5 w-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Selection */}
        <div>
          <label
            htmlFor="currency-select"
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
          >
            Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 px-4 py-2.5 text-sm text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          isLoading={createAccount.isPending}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Create Account
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function BalanceTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-1">
        {formatShortDate(label)}
      </p>
      <p className="text-sm font-semibold text-secondary-900 dark:text-white">
        {formatCurrency(payload[0].value, currency)}
      </p>
      {payload[0].payload.change !== undefined && payload[0].payload.change !== 0 && (
        <p className={cn(
          'text-xs mt-0.5',
          payload[0].payload.change > 0 ? 'text-success-600' : 'text-danger-600'
        )}>
          {payload[0].payload.change > 0 ? '+' : ''}
          {formatCurrency(payload[0].payload.change, currency)}
        </p>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="text-sm text-secondary-500 dark:text-secondary-400">{label}</span>
      <span className="text-sm font-medium text-secondary-900 dark:text-white">{value}</span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-secondary-900 dark:text-white">{value}</p>
    </div>
  );
}

function AccountsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
              <div>
                <Skeleton variant="text" width={120} />
                <Skeleton variant="text" width={60} className="mt-1" />
              </div>
            </div>
            <Skeleton variant="text" width={60} height={24} className="rounded-full" />
          </div>
          <div className="mb-4">
            <Skeleton variant="text" width={60} />
            <Skeleton variant="text" width={140} height={28} className="mt-1" />
          </div>
          <div className="pt-3 border-t border-secondary-100 dark:border-secondary-800">
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountDetailSkeleton() {
  return (
    <div>
      <Skeleton variant="text" width={120} className="mb-4" />
      <div className="flex items-center gap-4 mb-6">
        <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl" />
        <div>
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="text" width={120} className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-5">
            <Skeleton variant="text" width={100} />
            <Skeleton variant="text" width={140} height={28} className="mt-2" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 p-6 mb-6">
        <Skeleton variant="rectangular" width="100%" height={240} className="rounded-lg" />
      </div>
    </div>
  );
}
