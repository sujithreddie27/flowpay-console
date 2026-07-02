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
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.profile() });
      const previousData = queryClient.getQueryData(queryKeys.settings.profile());
      queryClient.setQueryData(queryKeys.settings.profile(), (old: unknown) =>
        old ? { ...(old as object), ...updates } : old
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.settings.profile(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.profile() });
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
    onMutate: async (preferences) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.notifications() });
      const previousData = queryClient.getQueryData(queryKeys.settings.notifications());
      queryClient.setQueryData(queryKeys.settings.notifications(), (old: unknown) =>
        old ? { ...(old as object), ...preferences } : old
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.settings.notifications(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.notifications() });
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (methodId: string) =>
      paymentService.removePaymentMethod(methodId),
    onMutate: async (methodId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.payments.methods() });
      const previousMethods = queryClient.getQueryData(queryKeys.payments.methods());
      queryClient.setQueryData(queryKeys.payments.methods(), (old: unknown) =>
        Array.isArray(old) ? old.filter((m: { id: string }) => m.id !== methodId) : old
      );
      return { previousMethods };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMethods) {
        queryClient.setQueryData(queryKeys.payments.methods(), context.previousMethods);
      }
    },
    onSettled: () => {
      invalidateQueries.payments();
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (methodId: string) =>
      paymentService.setDefaultPaymentMethod(methodId),
    onMutate: async (methodId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.payments.methods() });
      const previousMethods = queryClient.getQueryData(queryKeys.payments.methods());
      queryClient.setQueryData(queryKeys.payments.methods(), (old: unknown) =>
        Array.isArray(old)
          ? old.map((m: { id: string; isDefault?: boolean }) => ({
              ...m,
              isDefault: m.id === methodId,
            }))
          : old
      );
      return { previousMethods };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMethods) {
        queryClient.setQueryData(queryKeys.payments.methods(), context.previousMethods);
      }
    },
    onSettled: () => {
      invalidateQueries.payments();
    },
  });
};
