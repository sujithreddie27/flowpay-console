import { useState, useCallback, useMemo } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Breadcrumbs } from '@/components';
import { Table, Badge, Button } from '@/components/ui';
import { useAuditLog } from '@/hooks/useAdmin';
import type { Column } from '@/components/ui';
import type { AuditLogEntry, AuditLogParams } from '@/types';

const RESOURCE_TYPES = [
  { value: 'user', label: 'User' },
  { value: 'account', label: 'Account' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'payment', label: 'Payment' },
  { value: 'settings', label: 'Settings' },
  { value: 'alert', label: 'Alert' },
];

const ACTION_TYPES = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'override', label: 'Override' },
  { value: 'flag', label: 'Flag' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'export', label: 'Export' },
  { value: 'bulk_retry', label: 'Bulk Retry' },
];

const PAGE_SIZE = 30;

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dateStr));
}

function getActionVariant(action: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
    create: 'success',
    update: 'primary',
    delete: 'danger',
    status_change: 'warning',
    override: 'danger',
    flag: 'danger',
    login: 'info',
    logout: 'secondary',
    export: 'info',
    bulk_retry: 'warning',
  };
  return map[action] || 'secondary';
}

function getResourceIcon(resource: string): string {
  const map: Record<string, string> = {
    user: '👤',
    account: '🏦',
    transaction: '💸',
    payment: '💳',
    settings: '⚙️',
    alert: '🔔',
  };
  return map[resource] || '📄';
}

// ============================================================================
// Changes Viewer
// ============================================================================

function ChangesViewer({ changes }: { changes: Record<string, any> }) {
  if (!changes || Object.keys(changes).length === 0) return null;

  return (
    <div className="mt-2 rounded-md bg-secondary-50 dark:bg-secondary-800 p-2">
      <div className="space-y-1">
        {Object.entries(changes).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            <span className="font-medium text-secondary-600 dark:text-secondary-400 min-w-[80px]">
              {key}:
            </span>
            {typeof value === 'object' && value !== null && 'from' in value && 'to' in value ? (
              <span className="text-secondary-700 dark:text-secondary-300">
                <span className="line-through text-danger-500">{String(value.from)}</span>
                {' → '}
                <span className="text-success-600 dark:text-success-400">{String(value.to)}</span>
              </span>
            ) : (
              <span className="text-secondary-700 dark:text-secondary-300">
                {JSON.stringify(value)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Audit Trail Page
// ============================================================================

export function AdminAuditTrailPage() {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const params = useMemo<AuditLogParams>(() => {
    const p: AuditLogParams = {
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    };
    if (userIdFilter) p.userId = userIdFilter;
    if (actionFilter) p.action = actionFilter;
    if (resourceFilter) p.resource = resourceFilter;
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    return p;
  }, [page, userIdFilter, actionFilter, resourceFilter, dateFrom, dateTo]);

  const { data, isLoading, isError, refetch } = useAuditLog(params);

  const clearFilters = useCallback(() => {
    setUserIdFilter('');
    setActionFilter('');
    setResourceFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (userIdFilter) count++;
    if (actionFilter) count++;
    if (resourceFilter) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [userIdFilter, actionFilter, resourceFilter, dateFrom, dateTo]);

  const columns: Column<AuditLogEntry>[] = useMemo(
    () => [
      {
        key: 'timestamp',
        header: 'Time',
        render: (value: string) => (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-secondary-400 flex-shrink-0" />
            <span className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-nowrap">
              {formatDateTime(value)}
            </span>
          </div>
        ),
      },
      {
        key: 'userName',
        header: 'User',
        render: (value: string, row: AuditLogEntry) => (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-700">
              <UserIcon className="h-3.5 w-3.5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {value}
              </p>
              <p className="truncate text-xs text-secondary-400">{row.ipAddress}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'action',
        header: 'Action',
        render: (value: string) => (
          <Badge variant={getActionVariant(value)} size="sm" rounded>
            {value.replace(/_/g, ' ')}
          </Badge>
        ),
      },
      {
        key: 'resource',
        header: 'Resource',
        render: (value: string, row: AuditLogEntry) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">{getResourceIcon(value)}</span>
            <div className="min-w-0">
              <p className="text-sm capitalize text-secondary-900 dark:text-secondary-100">
                {value}
              </p>
              <p className="truncate text-xs font-mono text-secondary-400">
                {row.resourceId}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'changes',
        header: 'Details',
        render: (_: any, row: AuditLogEntry) => (
          <div>
            {row.changes && Object.keys(row.changes).length > 0 ? (
              <button
                type="button"
                onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <DocumentTextIcon className="h-3.5 w-3.5" />
                {expandedRow === row.id ? 'Hide' : 'View'} Changes
              </button>
            ) : (
              <span className="text-xs text-secondary-400">—</span>
            )}
          </div>
        ),
      },
    ],
    [expandedRow]
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Audit Trail
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            Complete history of admin actions and system changes
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 p-4">
        <div className="flex items-center justify-between">
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
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                User ID
              </label>
              <input
                type="text"
                value={userIdFilter}
                onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
                placeholder="Filter by user ID"
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Actions</option>
                {ACTION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Resource Type
              </label>
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Resources</option>
                {RESOURCE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
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
          </div>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20 p-4">
          <p className="text-sm text-danger-700 dark:text-danger-400">
            Failed to load audit log. Please try refreshing.
          </p>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 overflow-hidden">
        <Table
          data={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          emptyMessage="No audit log entries found"
          hoverable
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

        {/* Expanded rows for changes */}
        {data?.items && expandedRow && (
          <div className="border-t border-secondary-200 dark:border-secondary-700">
            {data.items
              .filter((entry) => entry.id === expandedRow && entry.changes)
              .map((entry) => (
                <div
                  key={`changes-${entry.id}`}
                  className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DocumentTextIcon className="h-4 w-4 text-secondary-500" />
                    <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
                      Changes for {entry.resource} ({entry.resourceId})
                    </span>
                  </div>
                  <ChangesViewer changes={entry.changes!} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
