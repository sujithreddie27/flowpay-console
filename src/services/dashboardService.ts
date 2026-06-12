import apiClient from './axios.config';
import type {
  ApiResponse,
  DashboardStats,
  DashboardChartData,
  TransactionVolumeData,
  TransactionStatusDistribution,
  RevenueByDay,
} from '@/types';

// ============================================================================
// Dashboard Service
// ============================================================================

export const dashboardService = {
  /**
   * Get dashboard statistics (overview metrics)
   */
  getStats: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
  }): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      '/dashboard/stats',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get chart data for dashboard visualizations
   */
  getChartData: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'day' | 'week' | 'month';
  }): Promise<DashboardChartData> => {
    const response = await apiClient.get<ApiResponse<DashboardChartData>>(
      '/dashboard/charts',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get transaction volume over time
   */
  getTransactionVolume: async (params?: {
    fromDate?: string;
    toDate?: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<TransactionVolumeData[]> => {
    const response = await apiClient.get<ApiResponse<TransactionVolumeData[]>>(
      '/dashboard/transaction-volume',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get transaction status distribution (for pie/donut charts)
   */
  getStatusDistribution: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<TransactionStatusDistribution[]> => {
    const response = await apiClient.get<ApiResponse<TransactionStatusDistribution[]>>(
      '/dashboard/status-distribution',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get revenue by day (for bar charts)
   */
  getRevenueByDay: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<RevenueByDay[]> => {
    const response = await apiClient.get<ApiResponse<RevenueByDay[]>>(
      '/dashboard/revenue',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get real-time metrics (for live dashboard updates)
   */
  getRealTimeMetrics: async (): Promise<{
    activeUsers: number;
    pendingTransactions: number;
    processingRate: number;
    systemLoad: number;
    lastUpdated: string;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      activeUsers: number;
      pendingTransactions: number;
      processingRate: number;
      systemLoad: number;
      lastUpdated: string;
    }>>('/dashboard/realtime');
    return response.data.data;
  },

  /**
   * Get system health status
   */
  getSystemHealth: async (): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Array<{
      name: string;
      status: 'up' | 'down';
      latency?: number;
    }>;
    lastCheck: string;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      status: 'healthy' | 'degraded' | 'down';
      services: Array<{
        name: string;
        status: 'up' | 'down';
        latency?: number;
      }>;
      lastCheck: string;
    }>>('/dashboard/health');
    return response.data.data;
  },
};

export default dashboardService;
