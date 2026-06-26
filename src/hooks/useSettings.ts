import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  settingsService,
  paymentService,
  queryKeys,
  invalidateQueries,
} from '@/services';
import type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UpdateNotificationPreferencesRequest,
} from '@/types';

// ============================================================================
// Settings Hooks
// ============================================================================

export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.settings.profile(),
    queryFn: () => settingsService.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: UpdateProfileRequest) =>
      settingsService.updateProfile(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.profile(), data);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      settingsService.changePassword(data),
  });
};

export const useEnable2FA = () => {
  return useMutation({
    mutationFn: () => settingsService.enable2FA(),
  });
};

export const useVerify2FA = () => {
  return useMutation({
    mutationFn: (code: string) => settingsService.verify2FA(code),
  });
};

export const useDisable2FA = () => {
  return useMutation({
    mutationFn: (password: string) => settingsService.disable2FA(password),
  });
};

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: queryKeys.settings.notifications(),
    queryFn: () => settingsService.getNotificationPreferences(),
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: UpdateNotificationPreferencesRequest) =>
      settingsService.updateNotificationPreferences(preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings.notifications(), data);
    },
  });
};

export const useAddPaymentMethod = () => {
  return useMutation({
    mutationFn: (methodData: Parameters<typeof paymentService.addPaymentMethod>[0]) =>
      paymentService.addPaymentMethod(methodData),
    onSuccess: () => {
      invalidateQueries.payments();
    },
  });
};

export const useRemovePaymentMethod = () => {
  return useMutation({
    mutationFn: (methodId: string) =>
      paymentService.removePaymentMethod(methodId),
    onSuccess: () => {
      invalidateQueries.payments();
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  return useMutation({
    mutationFn: (methodId: string) =>
      paymentService.setDefaultPaymentMethod(methodId),
    onSuccess: () => {
      invalidateQueries.payments();
    },
  });
};
