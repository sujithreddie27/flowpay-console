import apiClient, { tokenManager } from './axios.config';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  UserProfile,
} from '@/types';

// ============================================================================
// Authentication Service
// ============================================================================

export const authService = {
  /**
   * User login with email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );

    const { accessToken, refreshToken, user, expiresIn } = response.data.data;

    // Store tokens in localStorage
    tokenManager.setTokens(accessToken, refreshToken);

    return { accessToken, refreshToken, user, expiresIn };
  },

  /**
   * User registration
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      '/auth/register',
      userData
    );

    const { accessToken, refreshToken, user, expiresIn } = response.data.data;

    // Store tokens in localStorage
    tokenManager.setTokens(accessToken, refreshToken);

    return { accessToken, refreshToken, user, expiresIn };
  },

  /**
   * Refresh access token using refresh token
   */
  refresh: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = tokenManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      { refreshToken }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;

    // Update stored tokens
    tokenManager.setTokens(accessToken, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken, expiresIn };
  },

  /**
   * User logout - invalidate tokens on server and clear local storage
   */
  logout: async (): Promise<void> => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      // Call logout endpoint to invalidate tokens on server
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (error) {
      // Continue with local cleanup even if server request fails
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local tokens
      tokenManager.clearTokens();

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'user_initiated' } 
      }));
    }
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data.data;
  },

  /**
   * Verify if current session is valid
   */
  verifySession: async (): Promise<boolean> => {
    try {
      await apiClient.get('/auth/verify');
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Request password reset email
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password/reset-request', { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password/reset', {
      token,
      newPassword,
    });
  },

  /**
   * Verify email with verification token
   */
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post('/auth/email/verify', { token });
  },

  /**
   * Resend email verification
   */
  resendVerificationEmail: async (): Promise<void> => {
    await apiClient.post('/auth/email/resend-verification');
  },
};

export default authService;
