import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, RefreshTokenResponse } from '@/types';

// ============================================================================
// Axios Instance Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_TIMEOUT = 30000; // 30 seconds

// Token storage keys
const ACCESS_TOKEN_KEY = 'flowpay_access_token';
const REFRESH_TOKEN_KEY = 'flowpay_refresh_token';

// Create Axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// Token Management Functions
// ============================================================================

export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ============================================================================
// Request Interceptor - Attach JWT Token
// ============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();

    // Attach Authorization header if token exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    if (import.meta.env.DEV) {
      config.headers['X-Request-Time'] = new Date().toISOString();
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptor - Handle Token Refresh
// ============================================================================

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * Process the queue of failed requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Attempt to refresh the access token
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenManager.getRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    // Update stored tokens
    tokenManager.setTokens(accessToken, newRefreshToken);

    return accessToken;
  } catch (error) {
    // Clear tokens on refresh failure
    tokenManager.clearTokens();
    throw error;
  }
};

apiClient.interceptors.response.use(
  // Success response - pass through
  (response) => response,

  // Error response - handle 401 and retry with refreshed token
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Prevent infinite retry loop
      originalRequest._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const newAccessToken = await refreshAccessToken();

        // Update the failed request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Process queued requests
        processQueue(null, newAccessToken);

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - process queue with error
        processQueue(refreshError as Error, null);

        // Clear tokens and redirect to login
        tokenManager.clearTokens();

        // Trigger logout event (to be handled by app)
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason: 'token_refresh_failed' } 
        }));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError: ApiError = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your internet connection.',
        },
        timestamp: new Date().toISOString(),
      };
      return Promise.reject(networkError);
    }

    // Handle other HTTP errors
    const apiError: ApiError = error.response.data || {
      success: false,
      error: {
        code: `HTTP_${error.response.status}`,
        message: error.message || 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(apiError);
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if user is authenticated (has valid access token)
 */
export const isAuthenticated = (): boolean => {
  return !!tokenManager.getAccessToken();
};

/**
 * Logout helper - clears tokens and triggers logout event
 */
export const logout = (): void => {
  tokenManager.clearTokens();
  window.dispatchEvent(new CustomEvent('auth:logout', { 
    detail: { reason: 'user_initiated' } 
  }));
};

/**
 * Configure API client base URL (useful for testing or environment switching)
 */
export const setApiBaseUrl = (baseUrl: string): void => {
  apiClient.defaults.baseURL = `${baseUrl}/api/v1`;
};

export default apiClient;
