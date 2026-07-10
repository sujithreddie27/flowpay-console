import { useQuery, useMutation } from '@tanstack/react-query';
import {
  accountService,
  queryKeys,
  invalidateQueries,
} from '@/services';
import type {
  AccountListParams,
  CreateAccountRequest,
  UpdateAccountRequest,
} from '@/types';

// ============================================================================
// Account Hooks
// ============================================================================

/**
 * Hook for getting list of accounts
 */
export const useAccounts = (params?: AccountListParams) => {
  return useQuery({
    queryKey: queryKeys.accounts.list(params),
    queryFn: () => accountService.getAccounts(params),
  });
};

/**
 * Hook for getting single account by ID
 */
export const useAccount = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.accounts.detail(accountId),
    queryFn: () => accountService.getAccountById(accountId),
    enabled: !!accountId,
  });
};

/**
 * Hook for getting account balance
 */
export const useAccountBalance = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.accounts.balance(accountId),
    queryFn: () => accountService.getBalance(accountId),
    enabled: !!accountId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook for getting account balance history
 */
export const useAccountBalanceHistory = (
  accountId: string,
  params?: { fromDate?: string; toDate?: string; interval?: 'day' | 'week' | 'month' }
) => {
  return useQuery({
    queryKey: queryKeys.accounts.balanceHistory(accountId, params),
    queryFn: () => accountService.getBalanceHistory(accountId, params),
    enabled: !!accountId,
  });
};

/**
 * Hook for getting account transactions
 */
export const useAccountTransactions = (
  accountId: string,
  params?: {
    page?: number;
    pageSize?: number;
    fromDate?: string;
    toDate?: string;
  }
) => {
  return useQuery({
    queryKey: queryKeys.accounts.transactions(accountId, params),
    queryFn: () => accountService.getAccountTransactions(accountId, params),
    enabled: !!accountId,
  });
};

/**
 * Hook for creating new account
 */
export const useCreateAccount = () => {
  return useMutation({
    mutationFn: (accountData: CreateAccountRequest) =>
      accountService.createAccount(accountData),
    onSuccess: () => {
      // Invalidate accounts list to refetch
      invalidateQueries.accounts();
    },
  });
};

/**
 * Hook for updating account
 */
export const useUpdateAccount = (accountId: string) => {
  return useMutation({
    mutationFn: (updates: UpdateAccountRequest) =>
      accountService.updateAccount(accountId, updates),
    onSuccess: () => {
      // Invalidate specific account and accounts list
      invalidateQueries.account(accountId);
      invalidateQueries.accounts();
    },
  });
};

/**
 * Hook for deleting/closing account
 */
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: (accountId: string) => accountService.deleteAccount(accountId),
    onSuccess: () => {
      // Invalidate accounts list
      invalidateQueries.accounts();
    },
  });
};

/**
 * Hook for freezing account
 */
export const useFreezeAccount = () => {
  return useMutation({
    mutationFn: ({ accountId, reason }: { accountId: string; reason?: string }) =>
      accountService.freezeAccount(accountId, reason),
    onSuccess: (_data, variables) => {
      // Invalidate specific account and accounts list
      invalidateQueries.account(variables.accountId);
      invalidateQueries.accounts();
    },
  });
};

/**
 * Hook for unfreezing account
 */
export const useUnfreezeAccount = () => {
  return useMutation({
    mutationFn: (accountId: string) => accountService.unfreezeAccount(accountId),
    onSuccess: (_data, accountId) => {
      // Invalidate specific account and accounts list
      invalidateQueries.account(accountId);
      invalidateQueries.accounts();
    },
  });
};

/**
 * Hook for downloading account statement
 */
export const useAccountStatement = () => {
  return useMutation({
    mutationFn: ({
      accountId,
      fromDate,
      toDate,
      format,
    }: {
      accountId: string;
      fromDate: string;
      toDate: string;
      format?: 'json' | 'pdf' | 'csv';
    }) => accountService.getStatement(accountId, { fromDate, toDate, format }),
    onSuccess: (blob, variables) => {
      // Create download link for file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `account-statement-${variables.accountId}.${variables.format || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * Hook for searching accounts (admin)
 */
export const useSearchAccounts = (query: string) => {
  return useQuery({
    queryKey: [...queryKeys.accounts.all, 'search', query],
    queryFn: () => accountService.searchAccounts(query),
    enabled: query.length > 2, // Only search if query is at least 3 characters
  });
};

export default useAccounts;
