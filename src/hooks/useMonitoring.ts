import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringService } from '@/services/monitoringService';
import { queryKeys } from '@/services/queryClient';
import type { MonitoringAlertListParams } from '@/types';

// ============================================================================
// System Health
// ============================================================================

export const useSystemHealth = (refetchInterval?: number | false) => {
  return useQuery({
    queryKey: queryKeys.monitoring.health(),
    queryFn: () => monitoringService.getSystemHealth(),
    refetchInterval: refetchInterval ?? 30_000,
  });
};

// ============================================================================
// API Response Times
// ============================================================================

export const useApiResponseTimes = (
  params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  },
  refetchInterval?: number | false,
) => {
  return useQuery({
    queryKey: queryKeys.monitoring.responseTimes(params),
    queryFn: () => monitoringService.getApiResponseTimes(params),
    refetchInterval: refetchInterval ?? 30_000,
  });
};

// ============================================================================
// Error Rates
// ============================================================================

export const useErrorRates = (
  params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  },
  refetchInterval?: number | false,
) => {
  return useQuery({
    queryKey: queryKeys.monitoring.errorRates(params),
    queryFn: () => monitoringService.getErrorRates(params),
    refetchInterval: refetchInterval ?? 30_000,
  });
};

// ============================================================================
// Kafka Consumer Lag
// ============================================================================

export const useKafkaConsumerLag = (refetchInterval?: number | false) => {
  return useQuery({
    queryKey: queryKeys.monitoring.kafkaLag(),
    queryFn: () => monitoringService.getKafkaConsumerLag(),
    refetchInterval: refetchInterval ?? 30_000,
  });
};

// ============================================================================
// Monitoring Alerts
// ============================================================================

export const useMonitoringAlerts = (
  params?: MonitoringAlertListParams,
  refetchInterval?: number | false,
) => {
  return useQuery({
    queryKey: queryKeys.monitoring.alerts(params),
    queryFn: () => monitoringService.getAlerts(params),
    refetchInterval: refetchInterval ?? 30_000,
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
