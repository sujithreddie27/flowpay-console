import apiClient from './axios.config';
import type {
  ApiResponse,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from '@/types';

// ============================================================================
// Settings Service
// ============================================================================

export const settingsService = {
  // ============================================================================
  // Profile Management
  // ============================================================================

  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/settings/profile');
    return response.data.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.patch<ApiResponse<UserProfile>>(
      '/settings/profile',
      updates
    );
    return response.data.data;
  },

  /**
   * Upload profile avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds 5MB limit.');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
      '/settings/profile/avatar',
      formData
    );
    return response.data.data;
  },

  /**
   * Remove profile avatar
   */
  removeAvatar: async (): Promise<void> => {
    await apiClient.delete('/settings/profile/avatar');
  },

  // ============================================================================
  // Security Settings
  // ============================================================================

  /**
   * Change password
   */
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    await apiClient.post('/settings/security/password', passwordData);
  },

  /**
   * Enable two-factor authentication
   */
  enable2FA: async (): Promise<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  }> => {
    const response = await apiClient.post<ApiResponse<{
      qrCode: string;
      secret: string;
      backupCodes: string[];
    }>>('/settings/security/2fa/enable');
    return response.data.data;
  },

  /**
   * Verify and activate two-factor authentication
   */
  verify2FA: async (code: string): Promise<void> => {
    await apiClient.post('/settings/security/2fa/verify', { code });
  },

  /**
   * Disable two-factor authentication
   */
  disable2FA: async (password: string): Promise<void> => {
    await apiClient.post('/settings/security/2fa/disable', { password });
  },

  /**
   * Get active sessions
   */
  getSessions: async (): Promise<Array<{
    id: string;
    device: string;
    browser: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    isCurrent: boolean;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      device: string;
      browser: string;
      location: string;
      ipAddress: string;
      lastActive: string;
      isCurrent: boolean;
    }>>>('/settings/security/sessions');
    return response.data.data;
  },

  /**
   * Revoke session
   */
  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/settings/security/sessions/${encodeURIComponent(sessionId)}`);
  },

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: async (): Promise<void> => {
    await apiClient.post('/settings/security/sessions/revoke-all');
  },

  // ============================================================================
  // Notification Preferences
  // ============================================================================

  /**
   * Get notification preferences
   */
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>(
      '/settings/notifications'
    );
    return response.data.data;
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (
    preferences: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.put<ApiResponse<NotificationPreferences>>(
      '/settings/notifications',
      preferences
    );
    return response.data.data;
  },

  /**
   * Test notification settings
   */
  testNotification: async (channel: 'email' | 'push' | 'sms'): Promise<void> => {
    await apiClient.post('/settings/notifications/test', { channel });
  },

  // ============================================================================
  // API Keys Management (for developers)
  // ============================================================================

  /**
   * Get API keys
   */
  getApiKeys: async (): Promise<Array<{
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed?: string;
    expiresAt?: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      key: string;
      createdAt: string;
      lastUsed?: string;
      expiresAt?: string;
    }>>>('/settings/api-keys');
    return response.data.data;
  },

  /**
   * Create new API key
   */
  createApiKey: async (name: string, expiresIn?: number): Promise<{
    id: string;
    name: string;
    key: string;
    secret: string;
    createdAt: string;
    expiresAt?: string;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      id: string;
      name: string;
      key: string;
      secret: string;
      createdAt: string;
      expiresAt?: string;
    }>>('/settings/api-keys', { name, expiresIn });
    return response.data.data;
  },

  /**
   * Revoke API key
   */
  revokeApiKey: async (keyId: string): Promise<void> => {
    await apiClient.delete(`/settings/api-keys/${encodeURIComponent(keyId)}`);
  },

  // ============================================================================
  // Audit Log
  // ============================================================================

  /**
   * Get user activity log
   */
  getActivityLog: async (params?: {
    page?: number;
    pageSize?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(
      '/settings/activity-log',
      { params }
    );
    return response.data.data;
  },

  /**
   * Export activity log
   */
  exportActivityLog: async (params?: {
    fromDate?: string;
    toDate?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> => {
    const response = await apiClient.get('/settings/activity-log/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // ============================================================================
  // Account Management
  // ============================================================================

  /**
   * Deactivate account (soft delete)
   */
  deactivateAccount: async (password: string, reason?: string): Promise<void> => {
    await apiClient.post('/settings/account/deactivate', { password, reason });
  },

  /**
   * Request account deletion (GDPR)
   */
  requestAccountDeletion: async (password: string, reason?: string): Promise<void> => {
    await apiClient.post('/settings/account/delete-request', { password, reason });
  },

  /**
   * Cancel account deletion request
   */
  cancelAccountDeletion: async (): Promise<void> => {
    await apiClient.post('/settings/account/cancel-deletion');
  },

  /**
   * Export user data (GDPR data portability)
   */
  exportUserData: async (): Promise<Blob> => {
    const response = await apiClient.get('/settings/account/export-data', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default settingsService;
