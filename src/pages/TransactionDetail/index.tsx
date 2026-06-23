import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  UserIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Breadcrumbs } from '@/components';
import { Card, CardBody, Badge, StatusBadge, Button, Modal, ModalHeader, ModalBody, ModalFooter, LoadingSpinner } from '@/components/ui';
import {
  useTransaction,
  useTransactionTimeline,
  useRetryTransaction,
  useDownloadReceipt,
} from '@/hooks';
import type { TransactionStatus, TransactionTimeline, AuditLogEntry } from '@/types';

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

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
  return formatDateTime(dateStr);
}

function getTimelineIcon(status: TransactionStatus) {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-5 w-5" />;
    case 'processing':
      return <ArrowsRightLeftIcon className="h-5 w-5" />;
    case 'completed':
      return <CheckCircleIcon className="h-5 w-5" />;
    case 'failed':
      return <XCircleIcon className="h-5 w-5" />;
    case 'reversed':
      return <ArrowPathIcon className="h-5 w-5" />;
    case 'cancelled':
      return <XMarkIcon className="h-5 w-5" />;
    default:
      return <ClockIcon className="h-5 w-5" />;
  }
}

function getTimelineColor(status: TransactionStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-success-100 text-success-600 border-success-300 dark:bg-success-900/30 dark:text-success-400 dark:border-success-700';
    case 'failed':
      return 'bg-danger-100 text-danger-600 border-danger-300 dark:bg-danger-900/30 dark:text-danger-400 dark:border-danger-700';
    case 'processing':
      return 'bg-primary-100 text-primary-600 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700';
    case 'reversed':
      return 'bg-warning-100 text-warning-600 border-warning-300 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-700';
    case 'cancelled':
      return 'bg-secondary-100 text-secondary-600 border-secondary-300 dark:bg-secondary-800 dark:text-secondary-400 dark:border-secondary-600';
    default:
      return 'bg-warning-100 text-warning-600 border-warning-300 dark:bg-warning-900/30 dark:text-warning-400 dark:border-warning-700';
  }
}

function getTimelineLineColor(status: TransactionStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-success-300 dark:bg-success-700';
    case 'failed':
      return 'bg-danger-300 dark:bg-danger-700';
    case 'processing':
      return 'bg-primary-300 dark:bg-primary-700';
    default:
      return 'bg-secondary-300 dark:bg-secondary-700';
  }
}

// ============================================================================
// Sub-components
// ============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-success-500" />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4" />
      )}
    </button>
  );
}

function StatusTimeline({ timeline }: { timeline: TransactionTimeline[] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center text-secondary-500 dark:text-secondary-400">
        No timeline events available.
      </div>
    );
  }

  return (
    <div className="relative">
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;
        return (
          <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connecting Line */}
            {!isLast && (
              <div
                className={`absolute left-5 top-10 w-0.5 h-[calc(100%-2.5rem)] ${getTimelineLineColor(event.status)}`}
              />
            )}

            {/* Icon */}
            <div
              className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${getTimelineColor(event.status)}`}
            >
              {getTimelineIcon(event.status)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {event.message}
                </p>
                <time className="flex-shrink-0 text-xs text-secondary-500 dark:text-secondary-400">
                  {formatRelativeTime(event.timestamp)}
                </time>
              </div>
              <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
                {formatDateTime(event.timestamp)}
              </p>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 rounded-md bg-secondary-50 dark:bg-secondary-800/50 p-2">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <p key={key} className="text-xs text-secondary-600 dark:text-secondary-400">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuditLog({ entries }: { entries: AuditLogEntry[] }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="py-8 text-center text-secondary-500 dark:text-secondary-400">
        No audit log entries available.
      </div>
    );
  }

  return (
    <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
      {entries.map((entry) => (
        <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
                <ShieldCheckIcon className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-secondary-900 dark:text-secondary-100">
                  <span className="font-medium">{entry.userName}</span>{' '}
                  <span className="text-secondary-600 dark:text-secondary-400">
                    {entry.action}
                  </span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-500 dark:text-secondary-400">
                  <span>{entry.ipAddress}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline truncate max-w-[200px]">{entry.userAgent}</span>
                </div>
                {entry.changes && Object.keys(entry.changes).length > 0 && (
                  <div className="mt-2 rounded-md bg-secondary-50 dark:bg-secondary-800/50 p-2 text-xs">
                    {Object.entries(entry.changes).map(([key, value]) => (
                      <p key={key} className="text-secondary-600 dark:text-secondary-400">
                        <span className="font-medium">{key}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <time className="flex-shrink-0 text-xs text-secondary-500 dark:text-secondary-400 whitespace-nowrap">
              {formatRelativeTime(entry.timestamp)}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const TransactionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: transaction, isLoading, isError, refetch } = useTransaction(id!);
  const { data: timeline } = useTransactionTimeline(id!);
  const retryMutation = useRetryTransaction();
  const downloadReceiptMutation = useDownloadReceipt();

  const [showRetryModal, setShowRetryModal] = useState(false);

  const handleRetry = () => {
    if (!id) return;
    retryMutation.mutate(id, {
      onSuccess: () => {
        setShowRetryModal(false);
        refetch();
      },
    });
  };

  const handleDownloadReceipt = () => {
    if (!id) return;
    downloadReceiptMutation.mutate(id);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6">
        <Breadcrumbs />
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-secondary-500 dark:text-secondary-400">
                Loading transaction details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !transaction) {
    return (
      <div className="p-6">
        <Breadcrumbs />
        <div className="max-w-5xl mx-auto">
          <Link
            to="/transactions"
            className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
            Back to Transactions
          </Link>
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-danger-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                  Transaction Not Found
                </h3>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-6">
                  The transaction you're looking for doesn't exist or you don't have access.
                </p>
                <Button variant="primary" onClick={() => navigate('/transactions')}>
                  Back to Transactions
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const canRetry = transaction.status === 'failed';
  const canDownload = transaction.status === 'completed' || transaction.status === 'reversed';

  return (
    <div className="p-6">
      <Breadcrumbs />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          to="/transactions"
          className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          Back to Transactions
        </Link>

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                Transaction Details
              </h1>
              <StatusBadge status={transaction.status} size="md" rounded />
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
              <span className="font-mono">{transaction.referenceId}</span>
              <CopyButton text={transaction.referenceId} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRetryModal(true)}
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Retry
              </Button>
            )}
            {canDownload && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadReceipt}
                isLoading={downloadReceiptMutation.isPending}
                leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
              >
                Download Receipt
              </Button>
            )}
          </div>
        </div>

        {/* Failure Reason Banner */}
        {transaction.status === 'failed' && transaction.failureReason && (
          <div className="rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger-800 dark:text-danger-300">
                Transaction Failed
              </p>
              <p className="mt-1 text-sm text-danger-700 dark:text-danger-400">
                {transaction.failureReason}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount & Type Card */}
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
                    <BanknotesIcon className="h-5 w-5 text-secondary-400" />
                    Transaction Summary
                  </h2>
                  <Badge
                    variant={
                      transaction.type === 'credit' || transaction.type === 'refund'
                        ? 'success'
                        : transaction.type === 'debit'
                        ? 'danger'
                        : 'primary'
                    }
                    size="md"
                    rounded
                  >
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Amount
                    </p>
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Fee
                    </p>
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                      {transaction.fee > 0
                        ? formatCurrency(transaction.fee, transaction.currency)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Net Amount
                    </p>
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                      {formatCurrency(transaction.netAmount, transaction.currency)}
                    </p>
                  </div>
                </div>

                {transaction.description && (
                  <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Description
                    </p>
                    <p className="text-sm text-secondary-700 dark:text-secondary-300">
                      {transaction.description}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Sender & Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Sender */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                      Sender
                    </h3>
                  </div>
                  {transaction.sender ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Name</p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {transaction.sender.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Account</p>
                        <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300">
                          {transaction.sender.accountNumber}
                        </p>
                      </div>
                      {transaction.sender.email && (
                        <div>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">Email</p>
                          <p className="text-sm text-secondary-700 dark:text-secondary-300">
                            {transaction.sender.email}
                          </p>
                        </div>
                      )}
                      {transaction.sender.phone && (
                        <div>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">Phone</p>
                          <p className="text-sm text-secondary-700 dark:text-secondary-300">
                            {transaction.sender.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-secondary-400 italic">No sender information</p>
                  )}
                </CardBody>
              </Card>

              {/* Recipient */}
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-success-600 dark:text-success-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
                      Recipient
                    </h3>
                  </div>
                  {transaction.recipient ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Name</p>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {transaction.recipient.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Account</p>
                        <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300">
                          {transaction.recipient.accountNumber}
                        </p>
                      </div>
                      {transaction.recipient.email && (
                        <div>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">Email</p>
                          <p className="text-sm text-secondary-700 dark:text-secondary-300">
                            {transaction.recipient.email}
                          </p>
                        </div>
                      )}
                      {transaction.recipient.phone && (
                        <div>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">Phone</p>
                          <p className="text-sm text-secondary-700 dark:text-secondary-300">
                            {transaction.recipient.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-secondary-400 italic">No recipient information</p>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Timestamps & Reference Info */}
            <Card>
              <CardBody>
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2 mb-6">
                  <DocumentTextIcon className="h-5 w-5 text-secondary-400" />
                  Details & Timestamps
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Transaction ID
                    </p>
                    <div className="flex items-center">
                      <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300 truncate">
                        {transaction.id}
                      </p>
                      <CopyButton text={transaction.id} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Reference ID
                    </p>
                    <div className="flex items-center">
                      <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300 truncate">
                        {transaction.referenceId}
                      </p>
                      <CopyButton text={transaction.referenceId} />
                    </div>
                  </div>
                  {transaction.idempotencyKey && (
                    <div>
                      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                        Idempotency Key
                      </p>
                      <div className="flex items-center">
                        <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300 truncate">
                          {transaction.idempotencyKey}
                        </p>
                        <CopyButton text={transaction.idempotencyKey} />
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Account ID
                    </p>
                    <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300 truncate">
                      {transaction.accountId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                      Initiated At
                    </p>
                    <p className="text-sm text-secondary-700 dark:text-secondary-300">
                      {formatDateTime(transaction.initiatedAt)}
                    </p>
                  </div>
                  {transaction.processedAt && (
                    <div>
                      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                        Processed At
                      </p>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">
                        {formatDateTime(transaction.processedAt)}
                      </p>
                    </div>
                  )}
                  {transaction.completedAt && (
                    <div>
                      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                        Completed At
                      </p>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300">
                        {formatDateTime(transaction.completedAt)}
                      </p>
                    </div>
                  )}
                  {transaction.failedAt && (
                    <div>
                      <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider mb-1">
                        Failed At
                      </p>
                      <p className="text-sm text-danger-600 dark:text-danger-400">
                        {formatDateTime(transaction.failedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Audit Log */}
            {transaction.auditLog && transaction.auditLog.length > 0 && (
              <Card>
                <CardBody>
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2 mb-6">
                    <ShieldCheckIcon className="h-5 w-5 text-secondary-400" />
                    Audit Log
                  </h2>
                  <AuditLog entries={transaction.auditLog} />
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div className="space-y-6">
            <Card>
              <CardBody>
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2 mb-6">
                  <ClockIcon className="h-5 w-5 text-secondary-400" />
                  Status Timeline
                </h2>
                <StatusTimeline
                  timeline={transaction.timeline || timeline || []}
                />
              </CardBody>
            </Card>

            {/* Metadata Card */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <Card>
                <CardBody>
                  <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-4">
                    Metadata
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(transaction.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
                          {key}
                        </span>
                        <span className="text-xs font-mono text-secondary-700 dark:text-secondary-300 text-right truncate max-w-[150px]">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Retry Confirmation Modal */}
      <Modal isOpen={showRetryModal} onClose={() => setShowRetryModal(false)} size="sm">
        <ModalHeader>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Retry Transaction
          </h3>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                Are you sure you want to retry this transaction?
              </p>
              <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
                Amount: <span className="font-medium">{formatCurrency(transaction.amount, transaction.currency)}</span>
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                Reference: <span className="font-mono">{transaction.referenceId}</span>
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRetryModal(false)}
              disabled={retryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetry}
              isLoading={retryMutation.isPending}
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
            >
              Retry Transaction
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};
