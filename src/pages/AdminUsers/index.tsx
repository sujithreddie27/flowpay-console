import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Breadcrumbs } from '@/components';
import { Table, Badge, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui';
import { useAdminUsers, useAdminUserDetail, useUpdateAdminUser } from '@/hooks/useAdmin';
import type { Column } from '@/components/ui';
import type { AdminUser, AdminUserListParams, AdminUserStatus } from '@/types';

const USER_STATUSES: { value: AdminUserStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const USER_ROLES: { value: string; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'operator', label: 'Operator' },
];

const PAGE_SIZE = 20;

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusVariant(status: AdminUserStatus): 'success' | 'warning' | 'danger' {
  const map: Record<AdminUserStatus, 'success' | 'warning' | 'danger'> = {
    active: 'success',
    inactive: 'warning',
    suspended: 'danger',
  };
  return map[status];
}

function getRoleBadgeVariant(role: string): 'primary' | 'secondary' | 'info' {
  const map: Record<string, 'primary' | 'secondary' | 'info'> = {
    admin: 'primary',
    operator: 'info',
    user: 'secondary',
  };
  return map[role] || 'secondary';
}

// ============================================================================
// User Detail Modal
// ============================================================================

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
  onStatusChange: (userId: string, status: AdminUserStatus, reason: string) => void;
  isUpdating: boolean;
}

function UserDetailModal({ userId, onClose, onStatusChange, isUpdating }: UserDetailModalProps) {
  const { data: user, isLoading } = useAdminUserDetail(userId ?? '');
  const [statusAction, setStatusAction] = useState<AdminUserStatus | null>(null);
  const [reason, setReason] = useState('');
  const navigate = useNavigate();

  const handleConfirmAction = () => {
    if (userId && statusAction && reason.trim()) {
      onStatusChange(userId, statusAction, reason.trim());
      setStatusAction(null);
      setReason('');
    }
  };

  if (!userId) return null;

  return (
    <Modal isOpen={!!userId} onClose={onClose} size="lg">
      <ModalHeader>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">User Details</h2>
      </ModalHeader>
      <ModalBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-secondary-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">{user.email}</p>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">{user.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={getStatusVariant(user.status)} size="sm" rounded>
                    {user.status}
                  </Badge>
                  <Badge variant={getRoleBadgeVariant(user.role)} size="sm" rounded>
                    {user.role}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3 text-center">
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Accounts</p>
                <p className="mt-1 text-lg font-semibold text-secondary-900 dark:text-white">
                  {user.accountsCount}
                </p>
              </div>
              <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3 text-center">
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Transactions</p>
                <p className="mt-1 text-lg font-semibold text-secondary-900 dark:text-white">
                  {user.totalTransactions}
                </p>
              </div>
              <div className="rounded-lg bg-secondary-50 dark:bg-secondary-800 p-3 text-center">
                <p className="text-xs text-secondary-500 dark:text-secondary-400">Volume</p>
                <p className="mt-1 text-lg font-semibold text-secondary-900 dark:text-white">
                  {formatCurrency(user.totalVolume)}
                </p>
              </div>
            </div>

            {/* Accounts */}
            {user.accounts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-secondary-900 dark:text-white mb-2">
                  Accounts
                </h4>
                <div className="divide-y divide-secondary-100 dark:divide-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-700">
                  {user.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white">
                          {account.accountNumber}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                          {account.accountType} • {account.currency}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                          {formatCurrency(account.balance)}
                        </p>
                        <Badge
                          variant={account.status === 'active' ? 'success' : account.status === 'frozen' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {account.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {user.recentTransactions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-secondary-900 dark:text-white">
                    Recent Transactions
                  </h4>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/transactions?userId=${user.id}`)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-secondary-100 dark:divide-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-700">
                  {user.recentTransactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-secondary-900 dark:text-white">
                          {txn.referenceId}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">
                          {formatDate(txn.initiatedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-secondary-900 dark:text-white">
                          {formatCurrency(txn.amount)}
                        </p>
                        <Badge
                          variant={
                            txn.status === 'completed' ? 'success' :
                            txn.status === 'failed' ? 'danger' :
                            txn.status === 'pending' ? 'warning' : 'secondary'
                          }
                          size="sm"
                        >
                          {txn.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Change Actions */}
            {!statusAction && (
              <div className="flex items-center gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
                {user.status !== 'suspended' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setStatusAction('suspended')}
                  >
                    <NoSymbolIcon className="h-4 w-4 mr-1" />
                    Suspend
                  </Button>
                )}
                {user.status === 'suspended' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStatusAction('active')}
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-1" />
                    Reactivate
                  </Button>
                )}
                {user.status === 'active' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStatusAction('inactive')}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            )}

            {/* Confirmation */}
            {statusAction && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20 p-4">
                <p className="text-sm font-medium text-warning-800 dark:text-warning-300 mb-2">
                  Confirm status change to <strong className="capitalize">{statusAction}</strong>
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  className="w-full rounded-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-3 py-2 text-sm text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={2}
                />
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmAction}
                    disabled={!reason.trim() || isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Confirm'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setStatusAction(null); setReason(''); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="text-xs text-secondary-400 dark:text-secondary-500 space-y-1 pt-2 border-t border-secondary-200 dark:border-secondary-700">
              <p>Created: {formatDate(user.createdAt)}</p>
              {user.lastLoginAt && <p>Last Login: {formatDate(user.lastLoginAt)}</p>}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-secondary-500">User not found.</p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Admin Users Page
// ============================================================================

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const updateUser = useUpdateAdminUser();

  const params = useMemo<AdminUserListParams>(() => {
    const p: AdminUserListParams = {
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    if (search) p.search = search;
    if (statusFilter) p.status = statusFilter;
    if (roleFilter) p.role = roleFilter as any;
    return p;
  }, [page, search, statusFilter, roleFilter]);

  const { data, isLoading, isError, refetch } = useAdminUsers(params);

  const handleSearch = useCallback(() => {
    setSearch(searchInput.trim());
    setPage(1);
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSearch();
    },
    [handleSearch]
  );

  const clearFilters = useCallback(() => {
    setStatusFilter(undefined);
    setRoleFilter(undefined);
    setSearch('');
    setSearchInput('');
    setPage(1);
  }, []);

  const handleStatusChange = useCallback(
    (userId: string, status: AdminUserStatus, reason: string) => {
      updateUser.mutate(
        { userId, data: { status, reason } },
        {
          onSuccess: () => {
            setSelectedUserId(null);
          },
        }
      );
    },
    [updateUser]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (roleFilter) count++;
    return count;
  }, [statusFilter, roleFilter]);

  const columns: Column<AdminUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'User',
        render: (_: string, row: AdminUser) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <UserIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {row.name}
              </p>
              <p className="truncate text-xs text-secondary-500">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (value: string) => (
          <Badge variant={getRoleBadgeVariant(value)} size="sm" rounded>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (value: AdminUserStatus) => (
          <Badge variant={getStatusVariant(value)} size="sm" rounded>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Badge>
        ),
      },
      {
        key: 'accountsCount',
        header: 'Accounts',
        className: 'text-center',
        headerClassName: 'text-center',
        render: (value: number) => (
          <span className="text-sm tabular-nums text-secondary-700 dark:text-secondary-300">
            {value}
          </span>
        ),
      },
      {
        key: 'totalTransactions',
        header: 'Transactions',
        className: 'text-right',
        headerClassName: 'text-right',
        render: (value: number) => (
          <span className="text-sm tabular-nums text-secondary-700 dark:text-secondary-300">
            {new Intl.NumberFormat('en-IN').format(value)}
          </span>
        ),
      },
      {
        key: 'totalVolume',
        header: 'Volume',
        className: 'text-right',
        headerClassName: 'text-right',
        render: (value: number) => (
          <span className="text-sm tabular-nums font-medium text-secondary-900 dark:text-secondary-100">
            {formatCurrency(value)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Joined',
        render: (value: string) => (
          <span className="text-sm text-secondary-500">{formatDate(value)}</span>
        ),
      },
      {
        key: 'id',
        header: '',
        render: (_: string, row: AdminUser) => (
          <button
            type="button"
            onClick={() => setSelectedUserId(row.id)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            View
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
            View, search, and manage all platform users
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Refresh
        </Button>
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
              placeholder="Search by name, email, or phone..."
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
          <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Status
              </label>
              <select
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value ? e.target.value as AdminUserStatus : undefined);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                {USER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                Role
              </label>
              <select
                value={roleFilter ?? ''}
                onChange={(e) => {
                  setRoleFilter(e.target.value || undefined);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-secondary-200 dark:border-secondary-600 bg-white dark:bg-secondary-900 px-3 py-2 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {isError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20 p-4">
          <p className="text-sm text-danger-700 dark:text-danger-400">
            Failed to load users. Please try refreshing.
          </p>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl bg-white dark:bg-secondary-800 shadow-sm ring-1 ring-secondary-100 dark:ring-secondary-700 overflow-hidden">
        <Table
          data={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          emptyMessage="No users found matching your criteria"
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
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onStatusChange={handleStatusChange}
        isUpdating={updateUser.isPending}
      />
    </div>
  );
}
