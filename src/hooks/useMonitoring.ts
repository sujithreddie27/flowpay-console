import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringService } from '@/services/monitoringService';
import { queryKeys } from '@/services/queryClient';
import { useAppSelector } from '@/store';

function useIsAdmin() {
  const user = useAppSelector((state) => state.auth.user);
  return user?.role?.toLowerCase() === 'admin';
}

// ============================================================================
// System Health
// ============================================================================

export const useSystemHealth = (refetchInterval?: number | false) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.monitoring.health(),
    queryFn: () => monitoringService.getSystemHealth(),
    refetchInterval: isAdmin ? (refetchInterval ?? 30_000) : false,
    enabled: isAdmin,
    retry: false,
  });
};

// ============================================================================
// API Response Times
// ============================================================================

export const useApiResponseTimes = (refetchInterval?: number | false) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.monitoring.responseTimes(),
    queryFn: () => monitoringService.getApiResponseTimes(),
    refetchInterval: isAdmin ? (refetchInterval ?? 30_000) : false,
    enabled: isAdmin,
    retry: false,
  });
};

// ============================================================================
// Error Rates
// ============================================================================

export const useErrorRates = (refetchInterval?: number | false) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.monitoring.errorRates(),
    queryFn: () => monitoringService.getErrorRates(),
    refetchInterval: isAdmin ? (refetchInterval ?? 30_000) : false,
    enabled: isAdmin,
    retry: false,
  });
};

// ============================================================================
// Kafka Consumer Lag
// ============================================================================

export const useKafkaConsumerLag = (refetchInterval?: number | false) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.monitoring.kafkaLag(),
    queryFn: () => monitoringService.getKafkaConsumerLag(),
    refetchInterval: isAdmin ? (refetchInterval ?? 30_000) : false,
    enabled: isAdmin,
    retry: false,
  });
};

// ============================================================================
// Monitoring Alerts
// ============================================================================

export const useMonitoringAlerts = (refetchInterval?: number | false) => {
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: queryKeys.monitoring.alerts(),
    queryFn: () => monitoringService.getAlerts(),
    refetchInterval: isAdmin ? (refetchInterval ?? 30_000) : false,
    enabled: isAdmin,
    retry: false,
  });
};

export const useAcknowledgeMonitoringAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => monitoringService.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.alerts() });
    },
  });
};

export const useResolveMonitoringAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => monitoringService.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monitoring.alerts() });
    },
  });
};
