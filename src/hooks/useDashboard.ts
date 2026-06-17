import { useQuery } from '@tanstack/react-query';
import { dashboardService, transactionService, queryKeys } from '@/services';
import type { TransactionListParams } from '@/types';

/**
 * Hook for fetching dashboard statistics
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 60_000,
  });
};

/**
 * Hook for fetching recent transactions (last 10)
 */
export const useRecentTransactions = (limit: number = 10) => {
  const params: TransactionListParams = {
    page: 1,
    pageSize: limit,
    sortBy: 'initiatedAt',
    sortOrder: 'desc',
  };

  return useQuery({
    queryKey: queryKeys.transactions.recent(limit),
    queryFn: () => transactionService.getTransactions(params),
    refetchInterval: 30_000,
  });
};
