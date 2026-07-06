import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { createTestStore } from '../utils';

// Mock the websocketService module
vi.mock('@/services/websocketService', () => {
  const statusListeners = new Set<(status: string) => void>();
  const messageListeners = new Map<string, Set<(msg: any) => void>>();

  return {
    websocketService: {
      status: 'disconnected' as string,
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn((eventType: string, handler: any) => {
        if (!messageListeners.has(eventType)) {
          messageListeners.set(eventType, new Set());
        }
        messageListeners.get(eventType)!.add(handler);
        return () => {
          messageListeners.get(eventType)?.delete(handler);
        };
      }),
      subscribeAll: vi.fn((handler: any) => {
        if (!messageListeners.has('*')) {
          messageListeners.set('*', new Set());
        }
        messageListeners.get('*')!.add(handler);
        return () => {
          messageListeners.get('*')?.delete(handler);
        };
      }),
      onStatusChange: vi.fn((listener: any) => {
        statusListeners.add(listener);
        return () => {
          statusListeners.delete(listener);
        };
      }),
    },
    // Helper for testing
    __statusListeners: statusListeners,
    __messageListeners: messageListeners,
  };
});

// Mock token manager
vi.mock('@/services/axios.config', () => ({
  tokenManager: {
    getAccessToken: vi.fn(() => 'mock-token'),
    getRefreshToken: vi.fn(() => 'mock-refresh-token'),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

function createWrapper(authenticated = false) {
  const store = createTestStore({
    auth: {
      isAuthenticated: authenticated,
      user: authenticated ? { id: 'user-1', name: 'Test', email: 'test@test.com', phone: '+1', role: 'user', status: 'active', createdAt: '', updatedAt: '' } : undefined,
      accessToken: authenticated ? 'token' : undefined,
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial disconnected status', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }), {
      wrapper: createWrapper(false),
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });

  it('provides connect and disconnect functions', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }), {
      wrapper: createWrapper(false),
    });

    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('provides send function', () => {
    const { result } = renderHook(() => useWebSocket({ autoConnect: false }), {
      wrapper: createWrapper(false),
    });

    expect(typeof result.current.send).toBe('function');
  });

  it('auto-connects when authenticated and autoConnect is true', async () => {
    const { websocketService } = await import('@/services/websocketService');

    renderHook(() => useWebSocket({ autoConnect: true }), {
      wrapper: createWrapper(true),
    });

    expect(websocketService.connect).toHaveBeenCalled();
  });

  it('does not auto-connect when not authenticated', async () => {
    const { websocketService } = await import('@/services/websocketService');

    renderHook(() => useWebSocket({ autoConnect: true }), {
      wrapper: createWrapper(false),
    });

    expect(websocketService.connect).not.toHaveBeenCalled();
  });

  it('calls connect on manual connect', async () => {
    const { websocketService } = await import('@/services/websocketService');

    const { result } = renderHook(() => useWebSocket({ autoConnect: false }), {
      wrapper: createWrapper(false),
    });

    act(() => {
      result.current.connect();
    });

    expect(websocketService.connect).toHaveBeenCalled();
  });

  it('calls disconnect on manual disconnect', async () => {
    const { websocketService } = await import('@/services/websocketService');

    const { result } = renderHook(() => useWebSocket({ autoConnect: false }), {
      wrapper: createWrapper(true),
    });

    act(() => {
      result.current.disconnect();
    });

    expect(websocketService.disconnect).toHaveBeenCalled();
  });

  it('calls send on the websocket service', async () => {
    const { websocketService } = await import('@/services/websocketService');

    const { result } = renderHook(() => useWebSocket({ autoConnect: false }), {
      wrapper: createWrapper(true),
    });

    act(() => {
      result.current.send('test_event', { data: 'hello' });
    });

    expect(websocketService.send).toHaveBeenCalledWith('test_event', { data: 'hello' });
  });

  it('subscribes to all events when no eventTypes specified', async () => {
    const { websocketService } = await import('@/services/websocketService');

    renderHook(() => useWebSocket({ autoConnect: false, eventTypes: [] }), {
      wrapper: createWrapper(false),
    });

    expect(websocketService.subscribeAll).toHaveBeenCalled();
  });

  it('subscribes to specific event types', async () => {
    const { websocketService } = await import('@/services/websocketService');

    renderHook(
      () =>
        useWebSocket({
          autoConnect: false,
          eventTypes: ['transaction_update', 'payment_complete'],
        }),
      { wrapper: createWrapper(false) }
    );

    expect(websocketService.subscribe).toHaveBeenCalledWith(
      'transaction_update',
      expect.any(Function)
    );
    expect(websocketService.subscribe).toHaveBeenCalledWith(
      'payment_complete',
      expect.any(Function)
    );
  });
});
