import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ApiError } from '@/types';

// ============================================================================
// React Query Configuration
// ============================================================================

/**
 * Default options for all queries
 */
const defaultQueryOptions = {
  queries: {
    // Stale time: 5 minutes (data is considered fresh for 5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: 10 minutes (unused data stays in cache for 10 minutes)
    gcTime: 10 * 60 * 1000,

    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount: number, error: ApiError) => {
      // Don't retry on 4xx errors (client errors)
      if (error.error?.code.startsWith('HTTP_4')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },

    // Refetch on window focus in production
    refetchOnWindowFocus: import.meta.env.PROD,

    // Don't refetch on mount if data is still fresh
    refetchOnMount: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Network mode: online (only run queries when online)
    networkMode: 'online' as const,
  },

  mutations: {
    // Retry failed mutations once
    retry: 1,

    // Retry delay for mutations
    retryDelay: 1000,

    // Network mode for mutations
    networkMode: 'online' as const,
  },
};

/**
 * Create and configure QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Query keys factory for consistent key management
 */
export const queryKeys = {
  // Auth keys
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Account keys
  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.accounts.lists(), params] as const,
    details: () => [...queryKeys.accounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), id] as const,
    balance: (id: string) => [...queryKeys.accounts.detail(id), 'balance'] as const,
    balanceHistory: (id: string, params?: any) => 
      [...queryKeys.accounts.detail(id), 'balanceHistory', params] as const,
    transactions: (id: string, params?: any) => 
      [...queryKeys.accounts.detail(id), 'transactions', params] as const,
  },

  // Transaction keys
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.transactions.lists(), params] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
    status: (id: string) => [...queryKeys.transactions.detail(id), 'status'] as const,
    timeline: (id: string) => [...queryKeys.transactions.detail(id), 'timeline'] as const,
    recent: (limit?: number) => [...queryKeys.transactions.all, 'recent', limit] as const,
    statistics: (params?: any) => 
      [...queryKeys.transactions.all, 'statistics', params] as const,
  },

  // Payment keys
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.payments.lists(), params] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    status: (id: string) => [...queryKeys.payments.detail(id), 'status'] as const,
    recent: (limit?: number) => [...queryKeys.payments.all, 'recent', limit] as const,
    methods: () => [...queryKeys.payments.all, 'methods'] as const,
    recipients: () => [...queryKeys.payments.all, 'recipients'] as const,
  },

  // Dashboard keys
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    charts: (params?: any) => [...queryKeys.dashboard.all, 'charts', params] as const,
  },

  // Settings keys
  settings: {
    all: ['settings'] as const,
    profile: () => [...queryKeys.settings.all, 'profile'] as const,
    notifications: () => [...queryKeys.settings.all, 'notifications'] as const,
  },
};

/**
 * Query invalidation helpers
 */
export const invalidateQueries = {
  /**
   * Invalidate all account-related queries
   */
  accounts: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  },

  /**
   * Invalidate specific account
   */
  account: (accountId: string) => {
    return queryClient.invalidateQueries({ 
      queryKey: queryKeys.accounts.detail(accountId) 
    });
  },

  /**
   * Invalidate all transaction-related queries
   */
  transactions: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  },

  /**
   * Invalidate specific transaction
   */
  transaction: (transactionId: string) => {
    return queryClient.invalidateQueries({ 
      queryKey: queryKeys.transactions.detail(transactionId) 
    });
  },

  /**
   * Invalidate all payment-related queries
   */
  payments: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
  },

  /**
   * Invalidate specific payment
   */
  payment: (paymentId: string) => {
    return queryClient.invalidateQueries({ 
      queryKey: queryKeys.payments.detail(paymentId) 
    });
  },

  /**
   * Invalidate dashboard data
   */
  dashboard: () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },

  /**
   * Invalidate all queries (use sparingly)
   */
  all: () => {
    return queryClient.invalidateQueries();
  },
};

/**
 * Prefetch helpers for optimistic loading
 */
export const prefetchQueries = {
  /**
   * Prefetch account details
   */
  account: async (accountId: string) => {
    const { accountService } = await import('./index');
    return queryClient.prefetchQuery({
      queryKey: queryKeys.accounts.detail(accountId),
      queryFn: () => accountService.getAccountById(accountId),
    });
  },

  /**
   * Prefetch transaction details
   */
  transaction: async (transactionId: string) => {
    const { transactionService } = await import('./index');
    return queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.detail(transactionId),
      queryFn: () => transactionService.getTransactionById(transactionId),
    });
  },

  /**
   * Prefetch payment details
   */
  payment: async (paymentId: string) => {
    const { paymentService } = await import('./index');
    return queryClient.prefetchQuery({
      queryKey: queryKeys.payments.detail(paymentId),
      queryFn: () => paymentService.getPaymentById(paymentId),
    });
  },
};

/**
 * Export QueryClientProvider for convenience
 */
export { QueryClientProvider };

export default queryClient;
