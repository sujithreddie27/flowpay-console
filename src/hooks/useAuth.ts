import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  authService,
  queryKeys,
  invalidateQueries,
} from '@/services';
import type {
  LoginRequest,
  RegisterRequest,
  UserProfile,
  ChangePasswordRequest,
} from '@/types';

// ============================================================================
// Authentication Hooks
// ============================================================================

/**
 * Hook for getting current authenticated user
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: authService.getCurrentUser,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });
};

/**
 * Hook for login mutation
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      
      // Navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
};

/**
 * Hook for register mutation
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      
      // Navigate to dashboard
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
};

/**
 * Hook for logout mutation
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Navigate to login
      navigate('/login');
    },
  });
};

/**
 * Hook for verifying session
 */
export const useVerifySession = () => {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: authService.verifySession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

/**
 * Hook for password reset request
 */
export const usePasswordResetRequest = () => {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });
};

/**
 * Hook for password reset
 */
export const usePasswordReset = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      // Navigate to login after successful reset
      navigate('/login');
    },
  });
};

/**
 * Hook for email verification
 */
export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });
};

/**
 * Hook for resending verification email
 */
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: authService.resendVerificationEmail,
  });
};

/**
 * Custom hook to check authentication status
 */
export const useAuth = () => {
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  return {
    user,
    isAuthenticated: !!user && !isError,
    isLoading,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
};

export default useAuth;
