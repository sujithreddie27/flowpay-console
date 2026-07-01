import apiClient from './axios.config';
import type {
  ApiResponse,
  SystemHealthResponse,
  ApiResponseTimeData,
  ErrorRateData,
  KafkaConsumerLagData,
  MonitoringAlert,
  MonitoringAlertListParams,
  PaginatedResponse,
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
   * Get API response time percentiles (p50, p95, p99) over time
   */
  getApiResponseTimes: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  }): Promise<ApiResponseTimeData[]> => {
    const response = await apiClient.get<ApiResponse<ApiResponseTimeData[]>>(
      '/admin/monitoring/response-times',
      { params }
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Error Rates
  // --------------------------------------------------------------------------

  /**
   * Get error rate trend data over time
   */
  getErrorRates: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  }): Promise<ErrorRateData[]> => {
    const response = await apiClient.get<ApiResponse<ErrorRateData[]>>(
      '/admin/monitoring/error-rates',
      { params }
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Kafka Consumer Lag
  // --------------------------------------------------------------------------

  /**
   * Get Kafka consumer lag metrics per topic/partition
   */
  getKafkaConsumerLag: async (): Promise<KafkaConsumerLagData[]> => {
    const response = await apiClient.get<ApiResponse<KafkaConsumerLagData[]>>(
      '/admin/monitoring/kafka-lag'
    );
    return response.data.data;
  },

  // --------------------------------------------------------------------------
  // Alerts
  // --------------------------------------------------------------------------

  /**
   * Get monitoring alerts with filtering
   */
  getAlerts: async (
    params?: MonitoringAlertListParams
  ): Promise<PaginatedResponse<MonitoringAlert>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<MonitoringAlert>>>(
      '/admin/monitoring/alerts',
      { params }
    );
    return response.data.data;
  },

  /**
   * Acknowledge a monitoring alert
   */
  acknowledgeAlert: async (alertId: string): Promise<MonitoringAlert> => {
    const response = await apiClient.put<ApiResponse<MonitoringAlert>>(
      `/admin/monitoring/alerts/${encodeURIComponent(alertId)}/acknowledge`
    );
    return response.data.data;
  },

  /**
   * Resolve a monitoring alert
   */
  resolveAlert: async (alertId: string): Promise<MonitoringAlert> => {
    const response = await apiClient.put<ApiResponse<MonitoringAlert>>(
      `/admin/monitoring/alerts/${encodeURIComponent(alertId)}/resolve`
    );
    return response.data.data;
  },
};

export default monitoringService;
