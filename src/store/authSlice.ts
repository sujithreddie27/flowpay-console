import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '@/services';
import { tokenManager } from '@/services/axios.config';
import type { UserProfile, LoginRequest, RegisterRequest } from '@/types';

// ============================================================================
// Auth State Interface
// ============================================================================

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
}

// ============================================================================
// Initial State - Rehydrate from localStorage
// ============================================================================

const getInitialState = (): AuthState => {
  const accessToken = tokenManager.getAccessToken();
  const refreshToken = tokenManager.getRefreshToken();
  const userStr = localStorage.getItem('flowpay_user');
  const expiresAtStr = localStorage.getItem('flowpay_token_expires_at');

  let user: UserProfile | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      localStorage.removeItem('flowpay_user');
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!accessToken && !!user,
    loading: false,
    error: null,
    tokenExpiresAt: expiresAtStr ? Number(expiresAtStr) : null,
  };
};

// ============================================================================
// Async Thunks
// ============================================================================

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      const message =
        error?.error?.message ||
        error?.message ||
        'Login failed. Please check your credentials.';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error: any) {
      const message =
        error?.error?.message ||
        error?.message ||
        'Registration failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      // Still proceed with local cleanup even if server request fails
      return rejectWithValue(error?.message || 'Logout failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error: any) {
      const message = error?.error?.message || error?.message || 'Failed to fetch user';
      return rejectWithValue(message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refresh();
      return response;
    } catch (error: any) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

// ============================================================================
// Auth Slice
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setCredentials(
      state,
      action: PayloadAction<{
        user: UserProfile;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>
    ) {
      const { user, accessToken, refreshToken, expiresIn } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.tokenExpiresAt = Date.now() + expiresIn * 1000;

      // Persist to localStorage
      localStorage.setItem('flowpay_user', JSON.stringify(user));
      localStorage.setItem(
        'flowpay_token_expires_at',
        String(state.tokenExpiresAt)
      );
    },
    resetAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.tokenExpiresAt = null;

      // Clear persisted data
      tokenManager.clearTokens();
      localStorage.removeItem('flowpay_user');
      localStorage.removeItem('flowpay_token_expires_at');
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken, expiresIn } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.tokenExpiresAt = Date.now() + expiresIn * 1000;

        // Persist user data
        localStorage.setItem('flowpay_user', JSON.stringify(user));
        localStorage.setItem(
          'flowpay_token_expires_at',
          String(state.tokenExpiresAt)
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const { user, accessToken, refreshToken, expiresIn } = action.payload;
        state.user = user;
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.tokenExpiresAt = Date.now() + expiresIn * 1000;

        localStorage.setItem('flowpay_user', JSON.stringify(user));
        localStorage.setItem(
          'flowpay_token_expires_at',
          String(state.tokenExpiresAt)
        );
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.tokenExpiresAt = null;

        localStorage.removeItem('flowpay_user');
        localStorage.removeItem('flowpay_token_expires_at');
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API fails, clear local state
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.tokenExpiresAt = null;

        localStorage.removeItem('flowpay_user');
        localStorage.removeItem('flowpay_token_expires_at');
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;

        localStorage.setItem('flowpay_user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.tokenExpiresAt = null;

        tokenManager.clearTokens();
        localStorage.removeItem('flowpay_user');
        localStorage.removeItem('flowpay_token_expires_at');
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = action.payload;
        state.accessToken = accessToken;
        state.refreshToken = newRefreshToken;
        state.tokenExpiresAt = Date.now() + expiresIn * 1000;

        localStorage.setItem(
          'flowpay_token_expires_at',
          String(state.tokenExpiresAt)
        );
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiresAt = null;

        tokenManager.clearTokens();
        localStorage.removeItem('flowpay_user');
        localStorage.removeItem('flowpay_token_expires_at');
      });
  },
});

export const { clearError, setCredentials, resetAuth } = authSlice.actions;
export default authSlice.reducer;
