import apiClient from './axios.config';
import type {
  ApiResponse,
  Payment,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  RetryPaymentRequest,
  CancelPaymentRequest,
  PaymentMethodInfo,
  PaginatedResponse,
  PaymentStatus,
} from '@/types';

// ============================================================================
// Payment Service
// ============================================================================

export const paymentService = {
  /**
   * Get list of payments with pagination
   */
  getPayments: async (params?: {
    page?: number;
    pageSize?: number;
    status?: PaymentStatus;
    accountId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Payment>>>(
      '/payments',
      { params }
    );
    return response.data.data;
  },

  /**
   * Get payment details by ID
   */
  getPaymentById: async (paymentId: string): Promise<Payment> => {
    const response = await apiClient.get<ApiResponse<Payment>>(
      `/payments/${paymentId}`
    );
    return response.data.data;
  },

  /**
   * Initiate new payment
   */
  initiatePayment: async (
    paymentData: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<ApiResponse<InitiatePaymentResponse>>(
      '/payments',
      paymentData
    );
    return response.data.data;
  },

  /**
   * Confirm payment (for payments requiring 2-step confirmation)
   */
  confirmPayment: async (
    paymentId: string,
    confirmationData?: {
      otp?: string;
      password?: string;
      signature?: string;
    }
  ): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/payments/${paymentId}/confirm`,
      confirmationData
    );
    return response.data.data;
  },

  /**
   * Retry failed payment
   */
  retryPayment: async (retryData: RetryPaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/payments/${retryData.paymentId}/retry`,
      { idempotencyKey: retryData.idempotencyKey }
    );
    return response.data.data;
  },

  /**
   * Cancel pending payment
   */
  cancelPayment: async (cancelData: CancelPaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/payments/${cancelData.paymentId}/cancel`,
      { reason: cancelData.reason }
    );
    return response.data.data;
  },

  /**
   * Refund completed payment
   */
  refundPayment: async (
    paymentId: string,
    refundData: {
      amount?: number; // Partial refund if specified
      reason: string;
      idempotencyKey: string;
    }
  ): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/payments/${paymentId}/refund`,
      refundData
    );
    return response.data.data;
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (paymentId: string): Promise<{
    status: PaymentStatus;
    message?: string;
    updatedAt: string;
  }> => {
    const response = await apiClient.get<ApiResponse<{
      status: PaymentStatus;
      message?: string;
      updatedAt: string;
    }>>(`/payments/${paymentId}/status`);
    return response.data.data;
  },

  /**
   * Get recent payments
   */
  getRecentPayments: async (limit: number = 10): Promise<Payment[]> => {
    const response = await apiClient.get<ApiResponse<Payment[]>>(
      '/payments/recent',
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Validate payment before submission
   */
  validatePayment: async (
    paymentData: InitiatePaymentRequest
  ): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    estimatedFee?: number;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      valid: boolean;
      errors?: string[];
      warnings?: string[];
      estimatedFee?: number;
    }>>('/payments/validate', paymentData);
    return response.data.data;
  },

  // ============================================================================
  // Payment Methods Management
  // ============================================================================

  /**
   * Get list of saved payment methods
   */
  getPaymentMethods: async (): Promise<PaymentMethodInfo[]> => {
    const response = await apiClient.get<ApiResponse<PaymentMethodInfo[]>>(
      '/payment-methods'
    );
    return response.data.data;
  },

  /**
   * Add new payment method
   */
  addPaymentMethod: async (methodData: {
    type: 'card' | 'bank_transfer' | 'wallet' | 'upi';
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvv?: string;
    bankAccountNumber?: string;
    bankRoutingNumber?: string;
    upiId?: string;
    walletId?: string;
  }): Promise<PaymentMethodInfo> => {
    const response = await apiClient.post<ApiResponse<PaymentMethodInfo>>(
      '/payment-methods',
      methodData
    );
    return response.data.data;
  },

  /**
   * Update payment method
   */
  updatePaymentMethod: async (
    methodId: string,
    updates: {
      isDefault?: boolean;
      expiryMonth?: number;
      expiryYear?: number;
    }
  ): Promise<PaymentMethodInfo> => {
    const response = await apiClient.patch<ApiResponse<PaymentMethodInfo>>(
      `/payment-methods/${methodId}`,
      updates
    );
    return response.data.data;
  },

  /**
   * Remove payment method
   */
  removePaymentMethod: async (methodId: string): Promise<void> => {
    await apiClient.delete(`/payment-methods/${methodId}`);
  },

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod: async (methodId: string): Promise<PaymentMethodInfo> => {
    const response = await apiClient.post<ApiResponse<PaymentMethodInfo>>(
      `/payment-methods/${methodId}/set-default`
    );
    return response.data.data;
  },

  // ============================================================================
  // Payment Recipients Management
  // ============================================================================

  /**
   * Search for payment recipients
   */
  searchRecipients: async (query: string): Promise<Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    accountNumber?: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      accountNumber?: string;
    }>>>('/payments/recipients/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  /**
   * Get saved recipients (beneficiaries)
   */
  getSavedRecipients: async (): Promise<Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    accountNumber?: string;
    isVerified: boolean;
    addedAt: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<Array<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      accountNumber?: string;
      isVerified: boolean;
      addedAt: string;
    }>>>('/payments/recipients');
    return response.data.data;
  },

  /**
   * Add recipient to saved list
   */
  addRecipient: async (recipientData: {
    name: string;
    email?: string;
    phone?: string;
    accountNumber?: string;
  }): Promise<void> => {
    await apiClient.post('/payments/recipients', recipientData);
  },

  /**
   * Remove saved recipient
   */
  removeRecipient: async (recipientId: string): Promise<void> => {
    await apiClient.delete(`/payments/recipients/${recipientId}`);
  },
};

export default paymentService;
