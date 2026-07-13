import apiClient from './axios.config';
import type {
  ApiResponse,
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountListParams,
  PaginatedResponse,
  AccountBalanceHistory,
} from '@/types';

// ============================================================================
// Account Service
// ============================================================================

export const accountService = {
  /**
   * Get list of accounts for current user
   */
  getAccounts: async (params?: AccountListParams): Promise<PaginatedResponse<Account>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Account>>>(
      '/accounts',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get account by ID
   */
  getAccountById: async (accountId: string): Promise<Account> => {
    const response = await apiClient.get<ApiResponse<Account>>(
      `/accounts/${encodeURIComponent(accountId)}`
    );
    return response.data.data;
  },

  /**
   * Create new account
   */
  createAccount: async (accountData: CreateAccountRequest): Promise<Account> => {
    const response = await apiClient.post<ApiResponse<Account>>(
      '/accounts',
      accountData
    );
    return response.data.data;
  },

  /**
   * Update account (e.g., freeze, unfreeze, close)
   */
  updateAccount: async (
    accountId: string,
    updates: UpdateAccountRequest
  ): Promise<Account> => {
    const response = await apiClient.patch<ApiResponse<Account>>(
      `/accounts/${encodeURIComponent(accountId)}`,
      updates
    );
    return response.data.data;
  },

  /**
   * Delete/close account
   */
  deleteAccount: async (accountId: string): Promise<void> => {
    await apiClient.delete(`/accounts/${encodeURIComponent(accountId)}`);
  },

  /**
   * Get account balance
   */
  getBalance: async (accountId: string): Promise<{
    balance: number;
    availableBalance: number;
    currency: string;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      balance: number;
      availableBalance: number;
      currency: string;
    }>>(`/accounts/${encodeURIComponent(accountId)}/balance`);
    return response.data.data;
  },

  /**
   * Get account balance history
   */
  getBalanceHistory: async (
    accountId: string,
    params?: { fromDate?: string; toDate?: string; interval?: 'day' | 'week' | 'month' }
  ): Promise<AccountBalanceHistory[]> => {
    const response = await apiClient.get<ApiResponse<AccountBalanceHistory[]>>(
      `/accounts/${encodeURIComponent(accountId)}/balance/history`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Freeze account
   */
  freezeAccount: async (accountId: string, reason?: string): Promise<Account> => {
    const response = await apiClient.post<ApiResponse<Account>>(
      `/accounts/${encodeURIComponent(accountId)}/freeze`,
      { reason }
    );
    return response.data.data;
  },

  /**
   * Unfreeze account
   */
  unfreezeAccount: async (accountId: string): Promise<Account> => {
    const response = await apiClient.post<ApiResponse<Account>>(
      `/accounts/${encodeURIComponent(accountId)}/unfreeze`
    );
    return response.data.data;
  },

  /**
   * Get account statement
   */
  getStatement: async (
    accountId: string,
    params: {
      fromDate: string;
      toDate: string;
      format?: 'json' | 'pdf' | 'csv';
    }
  ): Promise<Blob | any> => {
    const response = await apiClient.get(`/accounts/${encodeURIComponent(accountId)}/statement`, {
      params,
      responseType: params.format === 'json' ? 'json' : 'blob',
    });
    return response.data;
  },

  /**
   * Get account transactions
   */
  getAccountTransactions: async (
    accountId: string,
    params?: {
      page?: number;
      pageSize?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      `/accounts/${encodeURIComponent(accountId)}/transactions`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Search accounts (admin only)
   */
  searchAccounts: async (query: string): Promise<Account[]> => {
    const response = await apiClient.get<ApiResponse<Account[]>>(
      '/accounts/search',
      { params: { q: query } }
    );
    return response.data.data;
  },
};

export default accountService;
