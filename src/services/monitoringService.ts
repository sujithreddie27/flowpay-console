import apiClient from './axios.config';
import type {
  ApiResponse,
  SystemHealthResponse,
  ResponseTimesResponse,
  ErrorRatesResponse,
  KafkaLagResponse,
  MonitoringAlert,
} from '@/types';

// ============================================================================
// Monitoring Service — System health & observability endpoints
// ============================================================================

export const monitoringService = {
  // --------------------------------------------------------------------------
  // System Health
  // --------------------------------------------------------------------------

  /**
   * Get overall system health and individual service statuses
   * Connects to backend /actuator/health endpoint
   */
  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    const response = await apiClient.get<ApiResponse<SystemHealthResponse>>(
      '/admin/monitoring/health'
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // API Response Times
  // --------------------------------------------------------------------------

  /**
   * Get API response time percentiles (p50, p95, p99) — point-in-time snapshot
   */
  getApiResponseTimes: async (): Promise<ResponseTimesResponse> => {
    const response = await apiClient.get<ApiResponse<ResponseTimesResponse>>(
      '/admin/monitoring/response-times',
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Error Rates
  // --------------------------------------------------------------------------

  /**
   * Get error rate data — point-in-time snapshot
   */
  getErrorRates: async (): Promise<ErrorRatesResponse> => {
    const response = await apiClient.get<ApiResponse<ErrorRatesResponse>>(
      '/admin/monitoring/error-rates',
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Kafka Consumer Lag
  // --------------------------------------------------------------------------

  /**
   * Get Kafka consumer lag metrics per consumer group
   */
  getKafkaConsumerLag: async (): Promise<KafkaLagResponse> => {
    const response = await apiClient.get<ApiResponse<KafkaLagResponse>>(
      '/admin/monitoring/kafka-lag'
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Alerts
  // --------------------------------------------------------------------------

  /**
   * Get monitoring alerts
   */
  getAlerts: async (): Promise<MonitoringAlert[]> => {
    const response = await apiClient.get<ApiResponse<MonitoringAlert[]>>(
      '/admin/monitoring/alerts',
    );
    return response.data.data;
  },

  /**
   * Acknowledge a monitoring alert
   */
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiClient.put(
      `/admin/monitoring/alerts/${encodeURIComponent(alertId)}/acknowledge`
    );
  },

  /**
   * Resolve a monitoring alert
   */
  resolveAlert: async (alertId: string): Promise<void> => {
    await apiClient.put(
      `/admin/monitoring/alerts/${encodeURIComponent(alertId)}/resolve`
    );
  },
};

export default monitoringService;
