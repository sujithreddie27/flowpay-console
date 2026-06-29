import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, queryKeys } from '@/services';
import { websocketService } from '@/services/websocketService';

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
