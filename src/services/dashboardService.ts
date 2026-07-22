import apiClient from './axios.config';
import type {
  ApiResponse,
  DashboardStats,
  DashboardChartData,
  TransactionVolumeData,
  TransactionStatusDistribution,
  RevenueByDay,
} from '@/types';

/**
 * Normalize a date value from the backend into an ISO date string.
 * Handles: ISO string ("2026-07-15"), array ([2026,7,15]), epoch number.
 */
function normalizeDate(date: unknown): string {
  if (typeof date === 'string') return date;
  if (Array.isArray(date)) {
    // Jackson LocalDate array: [year, month, day] (month is 1-based)
    const [y, m, d] = date;
    return `${y}-${String(m).padStart(2, '0')}-${String(d ?? 1).padStart(2, '0')}`;
  }
  if (typeof date === 'number') {
    return new Date(date).toISOString().slice(0, 10);
  }
  return String(date);
}

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
    const response = await apiClient.get<ApiResponse<any>>(
      '/dashboard/charts',
      { params }
    );
    const raw = response.data.data;

    // Transform backend shape to frontend expected shape
    const rawVolume = raw.volumeData ?? raw.transactionVolume ?? [];
    const rawRevenue = raw.revenueData ?? raw.revenue ?? [];

    // Map backend field names to frontend types
    // Backend: { date, count, amount } → Frontend: { date, count, volume }
    const volumeData: TransactionVolumeData[] = rawVolume.map((item: any) => ({
      date: normalizeDate(item.date),
      count: item.count ?? 0,
      volume: item.volume ?? item.amount ?? 0,
    }));

    // Backend: { date, fees } → Frontend: { date, revenue, currency }
    const revenueData: RevenueByDay[] = rawRevenue.map((item: any) => ({
      date: normalizeDate(item.date),
      revenue: item.revenue ?? item.fees ?? 0,
      currency: item.currency ?? 'INR',
    }));

    // statusDistribution may be a Map<string, number> from backend
    let statusDistribution = raw.statusDistribution ?? [];
    if (statusDistribution && !Array.isArray(statusDistribution)) {
      const total = Object.values(statusDistribution as Record<string, number>).reduce((sum: number, v: number) => sum + v, 0);
      statusDistribution = Object.entries(statusDistribution as Record<string, number>).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));
    }

    return { volumeData, statusDistribution, revenueData };
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
