import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import authReducer, { AuthState } from '@/store/authSlice';

// ============================================================================
// Test Store Factory
// ============================================================================

interface PreloadedState {
  auth?: Partial<AuthState>;
}

export function createTestStore(preloadedState?: PreloadedState) {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: preloadedState
      ? {
          auth: {
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            tokenExpiresAt: null,
            ...preloadedState.auth,
          },
        }
      : undefined,
  });
}

// ============================================================================
// Test Query Client
// ============================================================================

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// All Providers Wrapper
// ============================================================================

interface AllProvidersProps {
  children: ReactNode;
  preloadedState?: PreloadedState;
  queryClient?: QueryClient;
}

function AllProviders({ children, preloadedState, queryClient }: AllProvidersProps) {
  const store = createTestStore(preloadedState);
  const client = queryClient || createTestQueryClient();

  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}

// ============================================================================
// Custom Render
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { preloadedState, queryClient, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders preloadedState={preloadedState} queryClient={queryClient}>
      {children}
    </AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store: createTestStore(preloadedState),
  };
}

// ============================================================================
// Re-export everything from RTL
// ============================================================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { renderWithProviders as render };
