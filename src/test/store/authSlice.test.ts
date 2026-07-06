import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  refreshToken,
  clearError,
  setCredentials,
  resetAuth,
  AuthState,
} from '@/store/authSlice';

// Mock authService
vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('@/services/axios.config', () => ({
  tokenManager: {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function createStore(preloadedAuth?: Partial<AuthState>) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: preloadedAuth
      ? {
          auth: {
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            tokenExpiresAt: null,
            ...preloadedAuth,
          },
        }
      : undefined,
  });
}

const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'user' as const,
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('reducers', () => {
    it('clearError sets error to null', () => {
      const store = createStore({ error: 'Some error' });
      store.dispatch(clearError());
      expect(store.getState().auth.error).toBeNull();
    });

    it('setCredentials sets user data and authentication state', () => {
      const store = createStore();
      store.dispatch(
        setCredentials({
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        })
      );

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.tokenExpiresAt).toBeGreaterThan(Date.now());
    });

    it('setCredentials persists user to localStorage', () => {
      const store = createStore();
      store.dispatch(
        setCredentials({
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
        })
      );

      expect(localStorage.getItem('flowpay_user')).toBe(JSON.stringify(mockUser));
      expect(localStorage.getItem('flowpay_token_expires_at')).not.toBeNull();
    });

    it('resetAuth clears all auth state', () => {
      const store = createStore({
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        tokenExpiresAt: Date.now() + 3600000,
      });

      localStorage.setItem('flowpay_user', JSON.stringify(mockUser));
      localStorage.setItem('flowpay_token_expires_at', String(Date.now()));

      store.dispatch(resetAuth());

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.tokenExpiresAt).toBeNull();
      expect(localStorage.getItem('flowpay_user')).toBeNull();
      expect(localStorage.getItem('flowpay_token_expires_at')).toBeNull();
    });
  });

  describe('loginUser thunk', () => {
    it('sets loading to true on pending', () => {
      const store = createStore();
      store.dispatch({ type: loginUser.pending.type });

      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets user and tokens on fulfilled', () => {
      const store = createStore();
      store.dispatch({
        type: loginUser.fulfilled.type,
        payload: {
          user: mockUser,
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      });

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('sets error on rejected', () => {
      const store = createStore();
      store.dispatch({
        type: loginUser.rejected.type,
        payload: 'Invalid credentials',
      });

      const state = store.getState().auth;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('registerUser thunk', () => {
    it('sets user and tokens on fulfilled', () => {
      const store = createStore();
      store.dispatch({
        type: registerUser.fulfilled.type,
        payload: {
          user: mockUser,
          accessToken: 'reg-access-token',
          refreshToken: 'reg-refresh-token',
          expiresIn: 3600,
        },
      });

      const state = store.getState().auth;
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('sets error on rejected', () => {
      const store = createStore();
      store.dispatch({
        type: registerUser.rejected.type,
        payload: 'Email already exists',
      });

      expect(store.getState().auth.error).toBe('Email already exists');
    });
  });

  describe('logoutUser thunk', () => {
    it('clears state on fulfilled', () => {
      const store = createStore({
        user: mockUser,
        accessToken: 'token',
        isAuthenticated: true,
      });

      store.dispatch({ type: logoutUser.fulfilled.type });

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('clears state even on rejected (server error)', () => {
      const store = createStore({
        user: mockUser,
        accessToken: 'token',
        isAuthenticated: true,
      });

      store.dispatch({ type: logoutUser.rejected.type });

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('refreshToken thunk', () => {
    it('updates tokens on fulfilled', () => {
      const store = createStore({
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        isAuthenticated: true,
      });

      store.dispatch({
        type: refreshToken.fulfilled.type,
        payload: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        },
      });

      const state = store.getState().auth;
      expect(state.accessToken).toBe('new-access-token');
      expect(state.refreshToken).toBe('new-refresh-token');
      expect(state.tokenExpiresAt).toBeGreaterThan(Date.now());
    });

    it('clears auth state on rejected (forces re-login)', () => {
      const store = createStore({
        user: mockUser,
        accessToken: 'old-token',
        refreshToken: 'old-refresh',
        isAuthenticated: true,
      });

      store.dispatch({ type: refreshToken.rejected.type });

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('fetchCurrentUser thunk', () => {
    it('sets user on fulfilled', () => {
      const store = createStore({ isAuthenticated: true, accessToken: 'token' });

      store.dispatch({
        type: fetchCurrentUser.fulfilled.type,
        payload: mockUser,
      });

      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });

    it('clears state on rejected (invalid token)', () => {
      const store = createStore({
        isAuthenticated: true,
        accessToken: 'bad-token',
      });

      store.dispatch({ type: fetchCurrentUser.rejected.type });

      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.accessToken).toBeNull();
    });
  });
});
