import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer, { resetAuth, refreshToken } from './authSlice';

// ============================================================================
// Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
      },
    }),
  devTools: import.meta.env.DEV,
});

// ============================================================================
// Type Definitions
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ============================================================================
// Typed Hooks
// ============================================================================

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ============================================================================
// Auth Event Listener - Handle external logout triggers
// ============================================================================

const handleAuthLogout = () => {
  store.dispatch(resetAuth());
};

window.addEventListener('auth:logout', handleAuthLogout);

// ============================================================================
// Token Refresh Scheduler
// ============================================================================

let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

export const scheduleTokenRefresh = () => {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }

  const state = store.getState();
  const { tokenExpiresAt, isAuthenticated } = state.auth;

  if (!isAuthenticated || !tokenExpiresAt) return;

  // Refresh 60 seconds before expiry
  const refreshAt = tokenExpiresAt - 60_000;
  const delay = refreshAt - Date.now();

  if (delay <= 0) {
    // Token is already expired or about to expire, refresh immediately
    store.dispatch(refreshToken());
    return;
  }

  refreshTimerId = setTimeout(() => {
    const currentState = store.getState();
    if (currentState.auth.isAuthenticated) {
      store.dispatch(refreshToken()).then(() => {
        // Schedule next refresh after successful refresh
        scheduleTokenRefresh();
      });
    }
  }, delay);
};

export const cancelTokenRefresh = () => {
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }
};

// Initialize token refresh on app load if authenticated
const initialState = store.getState();
if (initialState.auth.isAuthenticated) {
  scheduleTokenRefresh();
}

// ============================================================================
// Exports
// ============================================================================

export { resetAuth } from './authSlice';
export type { AuthState } from './authSlice';
