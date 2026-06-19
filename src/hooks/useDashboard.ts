import { useQuery } from '@tanstack/react-query';
import { dashboardService, queryKeys } from '@/services';
import { websocketService } from '@/services/websocketService';

/**
 * Hook for fetching dashboard statistics.
 * Polls every 30s when WebSocket is disconnected, otherwise relies on
 * real-time invalidation from the WebSocket layer.
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => dashboardService.getStats(),
    refetchInterval: () => {
      // Poll every 30s as fallback when WebSocket is not connected
      return websocketService.status !== 'connected' ? 30_000 : false;
    },
  });
};

/**
 * Hook for fetching all chart data (volume, status distribution, revenue)
 */
export const useDashboardCharts = (params?: {
  fromDate?: string;
  toDate?: string;
  interval?: 'day' | 'week' | 'month';
}) => {
  return useQuery({
    queryKey: queryKeys.dashboard.charts(params),
    queryFn: () => dashboardService.getChartData(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching transaction volume over time
 */
export const useTransactionVolume = (params?: {
  fromDate?: string;
  toDate?: string;
  interval?: 'hour' | 'day' | 'week' | 'month';
}) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.charts(params), 'volume'] as const,
    queryFn: () => dashboardService.getTransactionVolume(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching transaction status distribution
 */
export const useStatusDistribution = (params?: {
  fromDate?: string;
  toDate?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.charts(params), 'statusDistribution'] as const,
    queryFn: () => dashboardService.getStatusDistribution(params),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for fetching revenue by day
 */
export const useRevenueByDay = (params?: {
  fromDate?: string;
  toDate?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.dashboard.charts(params), 'revenue'] as const,
    queryFn: () => dashboardService.getRevenueByDay(params),
    staleTime: 5 * 60 * 1000,
  });
};
