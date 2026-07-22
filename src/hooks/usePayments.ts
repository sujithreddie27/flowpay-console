import { useQuery, useMutation } from '@tanstack/react-query';
import {
  paymentService,
  queryKeys,
  invalidateQueries,
} from '@/services';
import type {
  InitiatePaymentRequest,
} from '@/types';

// ============================================================================
// Payment Hooks
// ============================================================================

/**
 * Hook for initiating a new payment
 */
export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (paymentData: InitiatePaymentRequest) =>
      paymentService.initiatePayment(paymentData),
    onSuccess: () => {
      invalidateQueries.payments();
      invalidateQueries.transactions();
      invalidateQueries.accounts();
      invalidateQueries.dashboard();
    },
  });
};

/**
 * Hook for validating a payment before submission
 */
export const useValidatePayment = () => {
  return useMutation({
    mutationFn: (paymentData: InitiatePaymentRequest) =>
      paymentService.validatePayment(paymentData),
  });
};

/**
 * Hook for searching payment recipients
 */
export const useSearchRecipients = (query: string) => {
  return useQuery({
    queryKey: [...queryKeys.payments.recipients(), query],
    queryFn: () => paymentService.searchRecipients(query),
    enabled: query.length >= 2,
    staleTime: 10000,
  });
};

/**
 * Hook for getting saved recipients
 */
export const useSavedRecipients = () => {
  return useQuery({
    queryKey: queryKeys.payments.recipients(),
    queryFn: () => paymentService.getSavedRecipients(),
    retry: false,
    meta: { suppressError: true },
  });
};

/**
 * Hook for getting payment methods
 */
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: queryKeys.payments.methods(),
    queryFn: () => paymentService.getPaymentMethods(),
    retry: false,
    meta: { suppressError: true },
  });
};
