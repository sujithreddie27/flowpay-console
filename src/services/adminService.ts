import apiClient from './axios.config';
import type {
  ApiResponse,
  AdminDashboardStats,
  ProcessingRateData,
  SystemLatencyData,
  TopMerchant,
  AdminAlert,
  PaginatedResponse,
  AdminUser,
  AdminUserListParams,
  AdminUserDetail,
  UpdateAdminUserRequest,
  AdminTransactionListParams,
  Transaction,
  AdminTransactionOverride,
  FlagTransactionRequest,
  TransactionFlag,
  BulkRetryRequest,
  BulkRetryResponse,
  AuditLogEntry,
  AuditLogParams,
} from '@/types';

// ============================================================================
// Admin Service — Admin-specific API calls
// ============================================================================

export const adminService = {
  // --------------------------------------------------------------------------
  // Dashboard
  // --------------------------------------------------------------------------

  /**
   * Get admin dashboard statistics (system-wide overview)
   */
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<ApiResponse<AdminDashboardStats>>(
      '/admin/dashboard/stats'
    );
    return response.data.data;
  },

  /**
   * Get real-time transaction processing rate data
   */
  getProcessingRate: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  }): Promise<ProcessingRateData[]> => {
    const response = await apiClient.get<ApiResponse<ProcessingRateData[]>>(
      '/admin/dashboard/processing-rate',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get system latency metrics (p50, p95, p99)
   */
  getSystemLatency: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  }): Promise<SystemLatencyData[]> => {
    const response = await apiClient.get<ApiResponse<SystemLatencyData[]>>(
      '/admin/dashboard/latency',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get top merchants by transaction volume
   */
  getTopMerchants: async (params?: {
    limit?: number;
    period?: 'today' | 'week' | 'month';
  }): Promise<TopMerchant[]> => {
    const response = await apiClient.get<ApiResponse<TopMerchant[]>>(
      '/admin/dashboard/top-merchants',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get active alerts
   */
  getAlerts: async (params?: {
    severity?: 'critical' | 'warning' | 'info';
    acknowledged?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AdminAlert>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AdminAlert>>>(
      '/admin/alerts',
      { params }
    );
    return response.data.data;
  },

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiClient.put(`/admin/alerts/${encodeURIComponent(alertId)}/acknowledge`);
  },

  // --------------------------------------------------------------------------
  // User Management
  // --------------------------------------------------------------------------

  /**
   * Get paginated list of all users with search and filters
   */
  getUsers: async (params?: AdminUserListParams): Promise<PaginatedResponse<AdminUser>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AdminUser>>>(
      '/admin/users',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get user detail by ID (includes accounts and recent transactions)
   */
  getUserById: async (userId: string): Promise<AdminUserDetail> => {
    const response = await apiClient.get<ApiResponse<AdminUserDetail>>(
      `/admin/users/${encodeURIComponent(userId)}`
    );
    return response.data.data;
  },

  /**
   * Update user status or role (freeze/unfreeze/suspend)
   */
  updateUser: async (userId: string, data: UpdateAdminUserRequest): Promise<AdminUser> => {
    const response = await apiClient.patch<ApiResponse<AdminUser>>(
      `/admin/users/${encodeURIComponent(userId)}`,
      data
    );
    return response.data.data;
  },

  /**
   * Get transactions for a specific user
   */
  getUserTransactions: async (
    userId: string,
    params?: AdminTransactionListParams
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      `/admin/users/${encodeURIComponent(userId)}/transactions`,
      { params }
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Transaction Management
  // --------------------------------------------------------------------------

  /**
   * Get all system transactions (admin view)
   */
  getAllTransactions: async (
    params?: AdminTransactionListParams
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/admin/transactions',
      { params }
    );
    return response.data.data;
  },

  /**
   * Override transaction status manually
   */
  overrideTransactionStatus: async (data: AdminTransactionOverride): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/admin/transactions/${encodeURIComponent(data.transactionId)}/override`,
      { newStatus: data.newStatus, reason: data.reason }
    );
    return response.data.data;
  },

  /**
   * Flag a suspicious transaction
   */
  flagTransaction: async (data: FlagTransactionRequest): Promise<TransactionFlag> => {
    const response = await apiClient.post<ApiResponse<TransactionFlag>>(
      `/admin/transactions/${encodeURIComponent(data.transactionId)}/flag`,
      { reason: data.reason, severity: data.severity }
    );
    return response.data.data;
  },

  /**
   * Get flags for a transaction
   */
  getTransactionFlags: async (transactionId: string): Promise<TransactionFlag[]> => {
    const response = await apiClient.get<ApiResponse<TransactionFlag[]>>(
      `/admin/transactions/${encodeURIComponent(transactionId)}/flags`
    );
    return response.data.data;
  },

  /**
   * Bulk retry failed transactions
   */
  bulkRetry: async (data: BulkRetryRequest): Promise<BulkRetryResponse> => {
    const response = await apiClient.post<ApiResponse<BulkRetryResponse>>(
      '/admin/transactions/bulk-retry',
      data
    );
    return response.data.data;
  },

  /**
   * Export transactions as CSV (returns download URL)
   */
  exportTransactions: async (params?: AdminTransactionListParams): Promise<Blob> => {
    const response = await apiClient.get('/admin/transactions/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // --------------------------------------------------------------------------
  // Audit Trail
  // --------------------------------------------------------------------------

  /**
   * Get audit log entries
   */
  getAuditLog: async (params?: AuditLogParams): Promise<PaginatedResponse<AuditLogEntry>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLogEntry>>>(
      '/admin/audit-log',
      { params }
    );
    return response.data.data;
  },
};

export default adminService;
