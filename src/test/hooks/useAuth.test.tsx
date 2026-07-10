import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createTestStore, createTestQueryClient } from '../utils';
import { mockUser } from '../mocks/handlers';

function createWrapper(preloadedState?: any) {
  const store = createTestStore(preloadedState);
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );
  };
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns authenticated state when user exists in store', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper({
        auth: {
          user: mockUser,
          isAuthenticated: true,
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
        },
      }),
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('provides login function', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.login).toBe('function');
  });

  it('provides register function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.register).toBe('function');
  });

  it('provides logout function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper({
        auth: {
          user: mockUser,
          isAuthenticated: true,
          accessToken: 'test-token',
        },
      }),
    });

    expect(typeof result.current.logout).toBe('function');
  });

  it('provides clearError function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper({
        auth: { error: 'Some error' },
      }),
    });

    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
