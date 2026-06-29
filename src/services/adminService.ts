import apiClient from './axios.config';
import type {
  ApiResponse,
  AdminDashboardStats,
  ProcessingRateData,
  SystemLatencyData,
  TopMerchant,
  AdminAlert,
  PaginatedResponse,
} from '@/types';

// ============================================================================
// Admin Service — Admin-specific API calls
// ============================================================================

export const adminService = {
  /**
   * Get admin dashboard statistics (system-wide overview)
   */
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<ApiResponse<AdminDashboardStats>>(
      '/admin/dashboard/stats'
    );
    return response.data.data;
  },

  /**
   * Get real-time transaction processing rate data
   */
  getProcessingRate: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  }): Promise<ProcessingRateData[]> => {
    const response = await apiClient.get<ApiResponse<ProcessingRateData[]>>(
      '/admin/dashboard/processing-rate',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get system latency metrics (p50, p95, p99)
   */
  getSystemLatency: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'minute' | 'hour' | 'day';
  }): Promise<SystemLatencyData[]> => {
    const response = await apiClient.get<ApiResponse<SystemLatencyData[]>>(
      '/admin/dashboard/latency',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get top merchants by transaction volume
   */
  getTopMerchants: async (params?: {
    limit?: number;
    period?: 'today' | 'week' | 'month';
  }): Promise<TopMerchant[]> => {
    const response = await apiClient.get<ApiResponse<TopMerchant[]>>(
      '/admin/dashboard/top-merchants',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get active alerts
   */
  getAlerts: async (params?: {
    severity?: 'critical' | 'warning' | 'info';
    acknowledged?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<AdminAlert>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<AdminAlert>>>(
      '/admin/alerts',
      { params }
    );
    return response.data.data;
  },

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiClient.put(`/admin/alerts/${encodeURIComponent(alertId)}/acknowledge`);
  },
};

export default adminService;
