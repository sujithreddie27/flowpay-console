import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useAppDispatch,
  useAppSelector,
  scheduleTokenRefresh,
  cancelTokenRefresh,
} from '@/store';
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  clearError,
} from '@/store/authSlice';
import type { LoginRequest, RegisterRequest } from '@/types';

// ============================================================================
// Authentication Hooks
// ============================================================================

/**
 * Primary auth hook - provides user state, login, register, logout
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  // Revalidate user on mount if token exists but user data is stale
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  // Schedule token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      scheduleTokenRefresh();
    } else {
      cancelTokenRefresh();
    }
  }, [isAuthenticated]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await dispatch(loginUser(credentials));
      if (loginUser.fulfilled.match(result)) {
        scheduleTokenRefresh();
        // Redirect to intended page or dashboard
        const from =
          (location.state as { from?: { pathname: string } })?.from?.pathname ||
          '/dashboard';
        navigate(from, { replace: true });
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch, navigate, location.state]
  );

  const register = useCallback(
    async (userData: RegisterRequest) => {
      const result = await dispatch(registerUser(userData));
      if (registerUser.fulfilled.match(result)) {
        scheduleTokenRefresh();
        navigate('/dashboard', { replace: true });
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch, navigate]
  );

  const logout = useCallback(async () => {
    cancelTokenRefresh();
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading: loading,
    error,
    login,
    register,
    logout,
    clearError: clearAuthError,
  };
};

/**
 * Lightweight hook for components that only need auth status
 */
export const useAuthStatus = () => {
  const { isAuthenticated, user, loading } = useAppSelector(
    (state) => state.auth
  );
  return { isAuthenticated, user, isLoading: loading };
};

export default useAuth;
