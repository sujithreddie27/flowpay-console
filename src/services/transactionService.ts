import apiClient from './axios.config';
import type {
  ApiResponse,
  Transaction,
  TransactionDetails,
  TransactionListParams,
  PaginatedResponse,
  InitiateTransactionRequest,
  TransactionStatus,
} from '@/types';

// ============================================================================
// Transaction Service
// ============================================================================

export const transactionService = {
  /**
   * Get list of transactions with filters and pagination
   */
  getTransactions: async (
    params?: TransactionListParams
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/transactions',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get transaction details by ID
   */
  getTransactionById: async (transactionId: string): Promise<TransactionDetails> => {
    const response = await apiClient.get<ApiResponse<TransactionDetails>>(
      `/transactions/${encodeURIComponent(transactionId)}`
    );
    return response.data.data;
  },

  /**
   * Get transaction by reference ID
   */
  getTransactionByReference: async (referenceId: string): Promise<TransactionDetails> => {
    const response = await apiClient.get<ApiResponse<TransactionDetails>>(
      `/transactions/reference/${encodeURIComponent(referenceId)}`
    );
    return response.data.data;
  },

  /**
   * Initiate new transaction
   */
  initiateTransaction: async (
    transactionData: InitiateTransactionRequest
  ): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      '/transactions',
      transactionData
    );
    return response.data.data;
  },

  /**
   * Retry failed transaction
   */
  retryTransaction: async (transactionId: string): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/transactions/${encodeURIComponent(transactionId)}/retry`
    );
    return response.data.data;
  },

  /**
   * Cancel pending transaction
   */
  cancelTransaction: async (
    transactionId: string,
    reason?: string
  ): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/transactions/${encodeURIComponent(transactionId)}/cancel`,
      { reason }
    );
    return response.data.data;
  },

  /**
   * Reverse completed transaction (refund)
   */
  reverseTransaction: async (
    transactionId: string,
    reason: string,
    amount?: number
  ): Promise<Transaction> => {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      `/transactions/${encodeURIComponent(transactionId)}/reverse`,
      { reason, amount }
    );
    return response.data.data;
  },

  /**
   * Get transaction status
   */
  getTransactionStatus: async (transactionId: string): Promise<{
    status: TransactionStatus;
    message?: string;
    updatedAt: string;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      status: TransactionStatus;
      message?: string;
      updatedAt: string;
    }>>(`/transactions/${encodeURIComponent(transactionId)}/status`);
    return response.data.data;
  },

  /**
   * Get transaction timeline/history
   */
  getTransactionTimeline: async (transactionId: string): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/transactions/${encodeURIComponent(transactionId)}/timeline`
    );
    return response.data.data;
  },

  /**
   * Download transaction receipt
   */
  downloadReceipt: async (transactionId: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/transactions/${encodeURIComponent(transactionId)}/receipt`
    );
    return response.data.data;
  },

  /**
   * Export transactions to CSV
   */
  exportTransactions: async (params?: TransactionListParams): Promise<Blob> => {
    const response = await apiClient.get('/transactions/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get transaction statistics
   */
  getStatistics: async (params?: {
    fromDate?: string;
    toDate?: string;
    accountId?: string;
  }): Promise<{
    total: number;
    volume: number;
    averageAmount: number;
    successRate: number;
    byStatus: Record<TransactionStatus, number>;
    byType: Record<string, number>;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      total: number;
      volume: number;
      averageAmount: number;
      successRate: number;
      byStatus: Record<TransactionStatus, number>;
      byType: Record<string, number>;
    }>>('/transactions/statistics', { params });
    return response.data.data;
  },

  /**
   * Search transactions by keyword
   */
  searchTransactions: async (
    query: string,
    params?: {
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResponse<Transaction>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>(
      '/transactions/search',
      { params: { q: query, ...params } }
    );
    return response.data.data;
  },

  /**
   * Get recent transactions
   */
  getRecentTransactions: async (limit: number = 10): Promise<Transaction[]> => {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      '/transactions/recent',
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Validate transaction before submission (idempotency check)
   */
  validateTransaction: async (
    transactionData: InitiateTransactionRequest
  ): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> => {
    const response = await apiClient.post<ApiResponse<{
      valid: boolean;
      errors?: string[];
      warnings?: string[];
    }>>('/transactions/validate', transactionData);
    return response.data.data;
  },
};

export default transactionService;
