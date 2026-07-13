import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Table, Badge, StatusBadge, Button, Input, EmptyState, RetryError, LoadingSpinner } from '@/components/ui';
import { useTransactions, useMediaQuery, useInfiniteScroll } from '@/hooks';
import type { Column } from '@/components/ui';
import type {
  Transaction,
  TransactionListParams,
  TransactionStatus,
  TransactionType,
} from '@/types';

const TRANSACTION_STATUSES: { value: TransactionStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'credit', label: 'Credit' },
  { value: 'debit', label: 'Debit' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'payment', label: 'Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'reversal', label: 'Reversal' },
];

const PAGE_SIZE = 20;

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function getTypeBadgeVariant(type: TransactionType): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<TransactionType, 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'> = {
    credit: 'success',
    debit: 'danger',
    transfer: 'primary',
    payment: 'info',
    refund: 'warning',
    reversal: 'secondary',
  };
  return map[type] || 'secondary';
}

function exportTransactionsToCSV(transactions: Transaction[]) {
  const headers = [
    'Reference ID',
    'Type',
    'Status',
    'Amount',
    'Currency',
    'Fee',
    'Net Amount',
    'Sender',
    'Recipient',
    'Description',
    'Initiated At',
    'Completed At',
  ];

  const rows = transactions.map((t) => [
    t.referenceId,
    t.type,
    t.status,
    t.amount,
    t.currency,
    t.fee,
    t.netAmount,
    t.sender?.name || '',
    t.recipient?.name || '',
    t.description || '',
    t.initiatedAt,
    t.completedAt || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function TransactionsPage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [page, setPage] = useState(1);
  const [mobilePages, setMobilePages] = useState<Transaction[]>([]);
  const [sortBy, setSortBy] = useState<string>('initiatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<TransactionStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionType[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  const params = useMemo<TransactionListParams>(() => {
    const p: TransactionListParams = {
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortOrder,
    };
    if (search) p.search = search;
    if (statusFilter.length === 1) p.status = statusFilter[0];
    else if (statusFilter.length > 1) p.status = statusFilter;
    if (typeFilter.length === 1) p.type = typeFilter[0];
    else if (typeFilter.length > 1) p.type = typeFilter;
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    if (amountMin) p.amountMin = Number(amountMin);
    if (amountMax) p.amountMax = Number(amountMax);
    return p;
  }, [page, sortBy, sortOrder, search, statusFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax]);

  const { data, isLoading, isError, isFetching, refetch } = useTransactions(params);

  // Accumulate pages for mobile infinite scroll
  const hasNextPage = data ? page < data.totalPages : false;
  const prevDataRef = useRef(data?.items);

  // Update mobilePages when new data arrives
  useEffect(() => {
    if (isMobile && data?.items && data.items !== prevDataRef.current) {
      prevDataRef.current = data.items;
      if (page === 1) {
        setMobilePages(data.items);
      } else {
        setMobilePages((prev) => [...prev, ...data.items]);
      }
    }
  }, [data?.items, page, isMobile]);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage: isFetching && page > 1,
    fetchNextPage: () => setPage((p) => p + 1),
    enabled: isMobile,
  });

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
    setMobilePages([]);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  const toggleStatus = useCallback((status: TransactionStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
    setMobilePages([]);
  }, []);

  const toggleType = useCallback((type: TransactionType) => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(1);
    setMobilePages([]);
  }, []);

  const clearFilters = useCallback(() => {
    setStatusFilter([]);
    setTypeFilter([]);
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
    setSearch('');
    setSearchInput('');
    setPage(1);
    setMobilePages([]);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (typeFilter.length > 0) count++;
    if (dateFrom || dateTo) count++;
    if (amountMin || amountMax) count++;
    return count;
  }, [statusFilter, typeFilter, dateFrom, dateTo, amountMin, amountMax]);

  const handleExportCSV = useCallback(() => {
    if (data?.items?.length) {
      exportTransactionsToCSV(data.items);
    }
  }, [data]);

  const columns: Column<Transaction>[] = useMemo(
    () => [
      {
        key: 'referenceId',
        header: 'Reference ID',
        render: (_: string, row: Transaction) => (
          <button
            onClick={() => navigate(`/transactions/${row.id}`)}
            className="font-mono text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {row.referenceId}
          </button>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (value: TransactionType) => (
          <Badge variant={getTypeBadgeVariant(value)} size="sm" rounded>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (value: TransactionStatus) => (
          <StatusBadge status={value} size="sm" rounded />
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        sortable: true,
        className: 'text-right tabular-nums',
        headerClassName: 'text-right',
        render: (_: number, row: Transaction) => (
          <span
            className={
              row.type === 'credit' || row.type === 'refund'
                ? 'text-success-600 dark:text-success-400'
                : 'text-secondary-900 dark:text-secondary-100'
            }
          >
            {row.type === 'credit' || row.type === 'refund' ? '+' : '-'}
            {formatCurrency(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: 'fee',
        header: 'Fee',
        className: 'text-right tabular-nums',
        headerClassName: 'text-right',
        render: (_: number, row: Transaction) =>
          row.fee > 0 ? (
            <span className="text-secondary-500">{formatCurrency(row.fee, row.currency)}</span>
          ) : (
            <span className="text-secondary-400">—</span>
          ),
      },
      {
        key: 'sender',
        header: 'Sender',
        render: (_: unknown, row: Transaction) =>
          row.sender ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {row.sender.name}
              </p>
              <p className="truncate text-xs text-secondary-500">{row.sender.accountNumber}</p>
            </div>
          ) : (
            <span className="text-secondary-400">—</span>
          ),
      },
      {
        key: 'recipient',
        header: 'Recipient',
        render: (_: unknown, row: Transaction) =>
          row.recipient ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {row.recipient.name}
              </p>
              <p className="truncate text-xs text-secondary-500">{row.recipient.accountNumber}</p>
            </div>
          ) : (
            <span className="text-secondary-400">—</span>
          ),
      },
      {
        key: 'initiatedAt',
        header: 'Date',
        sortable: true,
        render: (value: string) => (
          <span className="text-sm text-secondary-600 dark:text-secondary-300 whitespace-nowrap">
            {formatDate(value)}
          </span>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            View and manage all payment transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<ArrowPathIcon className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!data?.items?.length}
            leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Input
              placeholder="Search by reference ID or recipient..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />}
              inputSize="sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleSearch}>
              Search
            </Button>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
            >
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="primary" size="sm" rounded className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {(activeFilterCount > 0 || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="border-t border-secondary-200 dark:border-secondary-700 p-4 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {TRANSACTION_STATUSES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleStatus(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      statusFilter.includes(value)
                        ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/40 dark:border-primary-600 dark:text-primary-300'
                        : 'bg-white border-secondary-300 text-secondary-600 hover:bg-secondary-50 dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {TRANSACTION_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => toggleType(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      typeFilter.includes(value)
                        ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/40 dark:border-primary-600 dark:text-primary-300'
                        : 'bg-white border-secondary-300 text-secondary-600 hover:bg-secondary-50 dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-300 dark:hover:bg-secondary-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
                />
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                  Min Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amountMin}
                  onChange={(e) => {
                    setAmountMin(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                  Max Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amountMax}
                  onChange={(e) => {
                    setAmountMax(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {(activeFilterCount > 0 || search) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-secondary-500 dark:text-secondary-400">
            Active filters:
          </span>
          {search && (
            <Badge variant="primary" size="sm" rounded>
              Search: "{search}"
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="ml-1 hover:text-primary-900"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter.map((s) => (
            <Badge key={s} variant="info" size="sm" rounded>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <button onClick={() => toggleStatus(s)} className="ml-1 hover:text-primary-900">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {typeFilter.map((t) => (
            <Badge key={t} variant="info" size="sm" rounded>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <button onClick={() => toggleType(t)} className="ml-1 hover:text-primary-900">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(dateFrom || dateTo) && (
            <Badge variant="info" size="sm" rounded>
              {dateFrom || '...'} → {dateTo || '...'}
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="ml-1 hover:text-primary-900"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(amountMin || amountMax) && (
            <Badge variant="info" size="sm" rounded>
              ${amountMin || '0'} – ${amountMax || '∞'}
              <button
                onClick={() => {
                  setAmountMin('');
                  setAmountMax('');
                  setPage(1);
                }}
                className="ml-1 hover:text-primary-900"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <RetryError
          title="Failed to load transactions"
          message="We couldn't load your transactions. Please check your connection and try again."
          onRetry={() => refetch()}
          isRetrying={isFetching}
          variant="card"
        />
      )}

      {/* Data Table - Desktop */}
      {!isMobile && (
        <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700 overflow-hidden">
          {!isError && (
            <Table<Transaction>
              data={data?.items || []}
              columns={columns}
              loading={isLoading}
              onSort={handleSort}
              striped
              emptyMessage="No transactions found"
              pagination={
                data
                  ? {
                      currentPage: data.page,
                      totalPages: data.totalPages,
                      pageSize: data.pageSize,
                      totalItems: data.total,
                      onPageChange: setPage,
                    }
                  : undefined
              }
            />
          )}

          {/* Empty state with filters active */}
          {!isLoading && !isError && data?.items?.length === 0 && activeFilterCount > 0 && (
            <EmptyState
              icon={<FunnelIcon className="h-8 w-8" />}
              title="No matching transactions"
              description="Try adjusting your filters or search criteria to find what you're looking for."
              action={{ label: 'Clear Filters', onClick: clearFilters }}
            />
          )}

          {/* Empty state without filters */}
          {!isLoading && !isError && data?.items?.length === 0 && activeFilterCount === 0 && !search && (
            <EmptyState
              icon={<BanknotesIcon className="h-8 w-8" />}
              title="No transactions yet"
              description="Transactions will appear here once payments are processed."
              action={{
                label: 'New Payment',
                onClick: () => navigate('/payments/new'),
              }}
            />
          )}
        </div>
      )}

      {/* Mobile Card View with Infinite Scroll */}
      {isMobile && !isError && (
        <div className="space-y-3">
          {isLoading && page === 1 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white dark:bg-secondary-800 p-4 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded bg-secondary-200 dark:bg-secondary-700" />
                    <div className="h-5 w-16 rounded-full bg-secondary-200 dark:bg-secondary-700" />
                  </div>
                  <div className="mt-3 h-5 w-32 rounded bg-secondary-200 dark:bg-secondary-700" />
                  <div className="mt-2 h-3 w-40 rounded bg-secondary-200 dark:bg-secondary-700" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {(mobilePages.length > 0 ? mobilePages : data?.items || []).map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="w-full rounded-xl bg-white dark:bg-secondary-800 p-4 shadow-sm ring-1 ring-secondary-200 dark:ring-secondary-700 text-left hover:ring-primary-300 dark:hover:ring-primary-700 transition-all active:scale-[0.98]"
                  aria-label={`Transaction ${tx.referenceId} - ${formatCurrency(tx.amount, tx.currency)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-secondary-500 dark:text-secondary-400">
                      {tx.referenceId}
                    </span>
                    <StatusBadge status={tx.status} size="sm" rounded />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {tx.recipient?.name || tx.sender?.name || 'Unknown'}
                      </p>
                      <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
                        {formatDate(tx.initiatedAt)}
                      </p>
                    </div>
                    <span className={`text-base font-semibold tabular-nums ${
                      tx.type === 'credit' || tx.type === 'refund'
                        ? 'text-success-600 dark:text-success-400'
                        : 'text-secondary-900 dark:text-secondary-100'
                    }`}>
                      {tx.type === 'credit' || tx.type === 'refund' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                </button>
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />

              {/* Loading indicator for next page */}
              {isFetching && page > 1 && (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-secondary-500">Loading more...</span>
                </div>
              )}

              {/* End of list */}
              {!hasNextPage && mobilePages.length > 0 && (
                <p className="py-4 text-center text-xs text-secondary-400 dark:text-secondary-500">
                  All transactions loaded
                </p>
              )}
            </>
          )}

          {/* Mobile empty states */}
          {!isLoading && data?.items?.length === 0 && activeFilterCount > 0 && (
            <EmptyState
              icon={<FunnelIcon className="h-8 w-8" />}
              title="No matching transactions"
              description="Try adjusting your filters."
              action={{ label: 'Clear Filters', onClick: clearFilters }}
            />
          )}
          {!isLoading && data?.items?.length === 0 && activeFilterCount === 0 && !search && (
            <EmptyState
              icon={<BanknotesIcon className="h-8 w-8" />}
              title="No transactions yet"
              description="Transactions will appear here once payments are processed."
              action={{ label: 'New Payment', onClick: () => navigate('/payments/new') }}
            />
          )}
        </div>
      )}
    </div>
  );
}
