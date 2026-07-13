import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FlagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { Breadcrumbs } from '@/components';
import {
  Table,
  Badge,
  StatusBadge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import {
  useAdminTransactions,
  useOverrideTransactionStatus,
  useFlagTransaction,
  useBulkRetryTransactions,
  useExportAdminTransactions,
} from '@/hooks/useAdmin';
import type { Column } from '@/components/ui';
import type {
  Transaction,
  AdminTransactionListParams,
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

const FLAG_SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

const PAGE_SIZE = 25;

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
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

// ============================================================================
// Status Override Modal
// ============================================================================

interface StatusOverrideModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (transactionId: string, newStatus: TransactionStatus, reason: string) => void;
  isPending: boolean;
}

function StatusOverrideModal({ transaction, onClose, onConfirm, isPending }: StatusOverrideModalProps) {
  const [newStatus, setNewStatus] = useState<TransactionStatus>('completed');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (transaction && reason.trim()) {
      onConfirm(transaction.id, newStatus, reason.trim());
    }
  };

  if (!transaction) return null;

  return (
    <Modal isOpen={!!transaction} onClose={onClose} size="md">
      <ModalHeader>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Override Transaction Status
        </h2>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3">
            <p className="text-xs text-secondary-500 dark:text-secondary-400">Transaction</p>
            <p className="text-sm font-mono font-medium text-secondary-900 dark:text-white">
              {transaction.referenceId}
            </p>
            <p className="text-xs text-secondary-500 mt-1">
              Current status: <StatusBadge status={transaction.status} size="sm" />
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TransactionStatus)}
              className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {TRANSACTION_STATUSES.filter((s) => s.value !== transaction.status).map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
              Reason <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a reason for this manual override..."
              className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          <div className="rounded-lg border border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20 p-3">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-warning-600 dark:text-warning-400" />
              <p className="text-xs font-medium text-warning-700 dark:text-warning-300">
                This action will be recorded in the audit trail.
              </p>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleSubmit}
          disabled={!reason.trim() || isPending}
        >
          {isPending ? 'Overriding...' : 'Override Status'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Flag Transaction Modal
// ============================================================================

interface FlagModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (transactionId: string, reason: string, severity: 'low' | 'medium' | 'high' | 'critical') => void;
  isPending: boolean;
}

function FlagModal({ transaction, onClose, onConfirm, isPending }: FlagModalProps) {
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (transaction && reason.trim()) {
      onConfirm(transaction.id, reason.trim(), severity);
    }
  };

  if (!transaction) return null;

  return (
    <Modal isOpen={!!transaction} onClose={onClose} size="md">
      <ModalHeader>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Flag Suspicious Transaction
        </h2>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3">
            <p className="text-xs text-secondary-500 dark:text-secondary-400">Transaction</p>
            <p className="text-sm font-mono font-medium text-secondary-900 dark:text-white">
              {transaction.referenceId}
            </p>
            <p className="text-xs text-secondary-500 mt-1">
              Amount: {formatCurrency(transaction.amount, transaction.currency)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {FLAG_SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
              Reason <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this transaction is suspicious..."
              className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={handleSubmit}
          disabled={!reason.trim() || isPending}
        >
          {isPending ? 'Flagging...' : 'Flag Transaction'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Bulk Retry Confirmation Modal
// ============================================================================

interface BulkRetryModalProps {
  selectedIds: string[];
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function BulkRetryModal({ selectedIds, onClose, onConfirm, isPending }: BulkRetryModalProps) {
  return (
    <Modal isOpen={selectedIds.length > 0} onClose={onClose} size="sm">
      <ModalHeader>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Bulk Retry Transactions
        </h2>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Are you sure you want to retry <strong>{selectedIds.length}</strong> failed transaction(s)?
          This action will attempt to re-process them.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Retrying...' : `Retry ${selectedIds.length} Transaction(s)`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Admin Transactions Page
// ============================================================================

export function AdminTransactionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('userId') || undefined;

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('initiatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState(initialUserId);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkRetryModal, setShowBulkRetryModal] = useState(false);

  // Modals
  const [overrideTransaction, setOverrideTransaction] = useState<Transaction | null>(null);
  const [flagTransaction, setFlagTransaction] = useState<Transaction | null>(null);

  // Mutations
  const overrideStatus = useOverrideTransactionStatus();
  const flagTxn = useFlagTransaction();
  const bulkRetry = useBulkRetryTransactions();
  const exportTxns = useExportAdminTransactions();

  const params = useMemo<AdminTransactionListParams>(() => {
    const p: AdminTransactionListParams = {
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortOrder,
    };
    if (search) p.search = search;
    if (statusFilter) p.status = statusFilter;
    if (typeFilter) p.type = typeFilter;
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    if (flaggedOnly) p.flagged = true;
    if (userIdFilter) p.userId = userIdFilter;
    return p;
  }, [page, sortBy, sortOrder, search, statusFilter, typeFilter, dateFrom, dateTo, flaggedOnly, userIdFilter]);

  const { data, isLoading, isError, refetch } = useAdminTransactions(params);

  const handleSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
    setSelectedIds([]);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  const clearFilters = useCallback(() => {
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setDateFrom('');
    setDateTo('');
    setFlaggedOnly(false);
    setUserIdFilter(undefined);
    setSearch('');
    setSearchInput('');
    setPage(1);
    setSelectedIds([]);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (typeFilter) count++;
    if (dateFrom || dateTo) count++;
    if (flaggedOnly) count++;
    if (userIdFilter) count++;
    return count;
  }, [statusFilter, typeFilter, dateFrom, dateTo, flaggedOnly, userIdFilter]);

  const handleOverrideConfirm = useCallback(
    (transactionId: string, newStatus: TransactionStatus, reason: string) => {
      overrideStatus.mutate(
        { transactionId, newStatus, reason },
        { onSuccess: () => setOverrideTransaction(null) }
      );
    },
    [overrideStatus]
  );

  const handleFlagConfirm = useCallback(
    (transactionId: string, reason: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
      flagTxn.mutate(
        { transactionId, reason, severity },
        { onSuccess: () => setFlagTransaction(null) }
      );
    },
    [flagTxn]
  );

  const handleBulkRetryConfirm = useCallback(() => {
    bulkRetry.mutate(
      { transactionIds: selectedIds, idempotencyKey: crypto.randomUUID() },
      {
        onSuccess: () => {
          setShowBulkRetryModal(false);
          setSelectedIds([]);
        },
      }
    );
  }, [bulkRetry, selectedIds]);

  const handleExport = useCallback(() => {
    exportTxns.mutate(params);
  }, [exportTxns, params]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!data?.items) return;
    const failedIds = data.items.filter((t) => t.status === 'failed').map((t) => t.id);
    if (selectedIds.length === failedIds.length && failedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(failedIds);
    }
  }, [data, selectedIds]);

  const columns: Column<Transaction>[] = useMemo(
    () => [
      {
        key: '_select',
        header: '',
        render: (_: any, row: Transaction) =>
          row.status === 'failed' ? (
            <input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onChange={() => toggleSelection(row.id)}
              className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
          ) : (
            <span className="inline-block h-4 w-4" />
          ),
      },
      {
        key: 'referenceId',
        header: 'Reference ID',
        render: (_: string, row: Transaction) => (
          <button
            type="button"
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
          <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {formatCurrency(row.amount, row.currency)}
          </span>
        ),
      },
      {
        key: 'sender',
        header: 'Sender',
        render: (_: unknown, row: Transaction) =>
          row.sender ? (
            <div className="min-w-0">
              <p className="truncate text-sm text-secondary-900 dark:text-secondary-100">
                {row.sender.name}
              </p>
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
              <p className="truncate text-sm text-secondary-900 dark:text-secondary-100">
                {row.recipient.name}
              </p>
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
          <span className="text-sm text-secondary-500">{formatDate(value)}</span>
        ),
      },
      {
        key: '_actions',
        header: '',
        render: (_: any, row: Transaction) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOverrideTransaction(row)}
              title="Override Status"
              className="rounded p-1 text-secondary-400 hover:text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFlagTransaction(row)}
              title="Flag as Suspicious"
              className="rounded p-1 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
            >
              <FlagIcon className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [navigate, selectedIds, toggleSelection]
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            All Transactions
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            System-wide transaction management with admin controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowBulkRetryModal(true)}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Retry ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exportTxns.isPending}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {exportTxns.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by reference ID, sender, or recipient..."
              className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 pl-9 pr-4 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleSearch}>
              Search
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {(activeFilterCount > 0 || search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <XMarkIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Status
              </label>
              <select
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value ? e.target.value as TransactionStatus : undefined);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                {TRANSACTION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Type
              </label>
              <select
                value={typeFilter ?? ''}
                onChange={(e) => {
                  setTypeFilter(e.target.value ? e.target.value as TransactionType : undefined);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                User ID
              </label>
              <input
                type="text"
                value={userIdFilter ?? ''}
                onChange={(e) => { setUserIdFilter(e.target.value || undefined); setPage(1); }}
                placeholder="Filter by user ID"
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flaggedOnly}
                  onChange={(e) => { setFlaggedOnly(e.target.checked); setPage(1); }}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Flagged only
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Select Info */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20 px-4 py-3">
          <CheckCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <p className="text-sm text-primary-700 dark:text-primary-300">
            <strong>{selectedIds.length}</strong> failed transaction(s) selected
          </p>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {data?.items?.filter((t) => t.status === 'failed').length === selectedIds.length
              ? 'Deselect All'
              : 'Select All Failed'}
          </button>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20 p-4">
          <p className="text-sm text-danger-700 dark:text-danger-400">
            Failed to load transactions. Please try refreshing.
          </p>
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 overflow-hidden">
        <Table
          data={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          emptyMessage="No transactions found matching your criteria"
          hoverable
          onSort={handleSort}
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
      </div>

      {/* Modals */}
      <StatusOverrideModal
        transaction={overrideTransaction}
        onClose={() => setOverrideTransaction(null)}
        onConfirm={handleOverrideConfirm}
        isPending={overrideStatus.isPending}
      />
      <FlagModal
        transaction={flagTransaction}
        onClose={() => setFlagTransaction(null)}
        onConfirm={handleFlagConfirm}
        isPending={flagTxn.isPending}
      />
      {showBulkRetryModal && (
        <BulkRetryModal
          selectedIds={selectedIds}
          onClose={() => setShowBulkRetryModal(false)}
          onConfirm={handleBulkRetryConfirm}
          isPending={bulkRetry.isPending}
        />
      )}
    </div>
  );
}
