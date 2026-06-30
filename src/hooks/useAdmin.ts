import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, queryKeys } from '@/services';
import { websocketService } from '@/services/websocketService';
import type {
  AdminUserListParams,
  AdminTransactionListParams,
  UpdateAdminUserRequest,
  AdminTransactionOverride,
  FlagTransactionRequest,
  BulkRetryRequest,
  AuditLogParams,
} from '@/types';

/**
 * Hook for fetching admin dashboard statistics.
 * Auto-polls every 15s when WebSocket is disconnected.
 */
export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => adminService.getDashboardStats(),
    refetchInterval: () => {
      return websocketService.status !== 'connected' ? 15_000 : false;
    },
  });
};

/**
 * Hook for fetching transaction processing rate chart data.
 */
export const useProcessingRate = (params?: {
  fromDate?: string;
  toDate?: string;
  interval?: 'minute' | 'hour' | 'day';
}) => {
  return useQuery({
    queryKey: queryKeys.admin.processingRate(params),
    queryFn: () => adminService.getProcessingRate(params),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });
};

/**
 * Hook for fetching system latency metrics.
 */
export const useSystemLatency = (params?: {
  fromDate?: string;
  toDate?: string;
  interval?: 'minute' | 'hour' | 'day';
}) => {
  return useQuery({
    queryKey: queryKeys.admin.latency(params),
    queryFn: () => adminService.getSystemLatency(params),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });
};

/**
 * Hook for fetching top merchants by volume.
 */
export const useTopMerchants = (params?: {
  limit?: number;
  period?: 'today' | 'week' | 'month';
}) => {
  return useQuery({
    queryKey: queryKeys.admin.topMerchants(params),
    queryFn: () => adminService.getTopMerchants(params),
    staleTime: 5 * 60_000,
  });
};

/**
 * Hook for fetching active admin alerts.
 */
export const useAdminAlerts = (params?: {
  severity?: 'critical' | 'warning' | 'info';
  acknowledged?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.admin.alerts(params),
    queryFn: () => adminService.getAlerts(params),
    refetchInterval: 30_000,
  });
};

/**
 * Hook for acknowledging an alert.
 */
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => adminService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.alerts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });
};

// ============================================================================
// User Management Hooks
// ============================================================================

/**
 * Hook for fetching paginated admin user list with search/filters.
 */
export const useAdminUsers = (params?: AdminUserListParams) => {
  return useQuery({
    queryKey: queryKeys.admin.userList(params),
    queryFn: () => adminService.getUsers(params),
    staleTime: 30_000,
  });
};

/**
 * Hook for fetching a single user detail.
 */
export const useAdminUserDetail = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.admin.userDetail(userId),
    queryFn: () => adminService.getUserById(userId),
    enabled: !!userId,
  });
};

/**
 * Hook for updating a user (status/role change).
 */
export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateAdminUserRequest }) =>
      adminService.updateUser(userId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.userDetail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });
};

/**
 * Hook for fetching a specific user's transactions.
 */
export const useAdminUserTransactions = (userId: string, params?: AdminTransactionListParams) => {
  return useQuery({
    queryKey: queryKeys.admin.userTransactions(userId, params),
    queryFn: () => adminService.getUserTransactions(userId, params),
    enabled: !!userId,
  });
};

// ============================================================================
// Admin Transaction Management Hooks
// ============================================================================

/**
 * Hook for fetching all system transactions (admin view).
 */
export const useAdminTransactions = (params?: AdminTransactionListParams) => {
  return useQuery({
    queryKey: queryKeys.admin.transactions(params),
    queryFn: () => adminService.getAllTransactions(params),
    staleTime: 15_000,
  });
};

/**
 * Hook for overriding transaction status manually.
 */
export const useOverrideTransactionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminTransactionOverride) => adminService.overrideTransactionStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
};

/**
 * Hook for flagging a suspicious transaction.
 */
export const useFlagTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FlagTransactionRequest) => adminService.flagTransaction(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.transactionFlags(variables.transactionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transactions() });
    },
  });
};

/**
 * Hook for fetching flags on a transaction.
 */
export const useTransactionFlags = (transactionId: string) => {
  return useQuery({
    queryKey: queryKeys.admin.transactionFlags(transactionId),
    queryFn: () => adminService.getTransactionFlags(transactionId),
    enabled: !!transactionId,
  });
};

/**
 * Hook for bulk retrying failed transactions.
 */
export const useBulkRetryTransactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRetryRequest) => adminService.bulkRetry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
};

/**
 * Hook for exporting admin transactions.
 */
export const useExportAdminTransactions = () => {
  return useMutation({
    mutationFn: (params?: AdminTransactionListParams) => adminService.exportTransactions(params),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `admin_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
};

// ============================================================================
// Audit Trail Hooks
// ============================================================================

/**
 * Hook for fetching audit log entries.
 */
export const useAuditLog = (params?: AuditLogParams) => {
  return useQuery({
    queryKey: queryKeys.admin.auditLog(params),
    queryFn: () => adminService.getAuditLog(params),
    staleTime: 30_000,
  });
};
