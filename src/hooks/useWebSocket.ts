import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService, type ConnectionStatus, type WebSocketEventHandler } from '@/services/websocketService';
import { tokenManager } from '@/services/axios.config';
import { useAppSelector } from '@/store';
import type { WebSocketMessage } from '@/types';

// ============================================================================
// useWebSocket - Real-Time WebSocket Hook
// ============================================================================

export interface UseWebSocketOptions {
  /**
   * Whether to auto-connect on mount (default: true)
   */
  autoConnect?: boolean;
  /**
   * Event types to subscribe to. If empty, subscribes to all events.
   */
  eventTypes?: string[];
  /**
   * Callback fired for every matching message
   */
  onMessage?: WebSocketEventHandler;
  /**
   * Callback fired on connection status change
   */
  onStatusChange?: (status: ConnectionStatus) => void;
  /**
   * Enable fallback polling interval in ms (default: 30000).
   * Set to 0 to disable polling fallback.
   */
  pollingInterval?: number;
  /**
   * Polling fetch function called when WebSocket is unavailable
   */
  pollingFn?: () => Promise<void>;
}

export interface UseWebSocketReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
  send: (type: string, payload: unknown) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = true,
    eventTypes = [],
    onMessage,
    onStatusChange,
    pollingInterval = 30000,
    pollingFn,
  } = options;

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [status, setStatus] = useState<ConnectionStatus>(websocketService.status);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMessageRef = useRef(onMessage);
  const onStatusChangeRef = useRef(onStatusChange);
  const pollingFnRef = useRef(pollingFn);

  // Keep refs up to date
  onMessageRef.current = onMessage;
  onStatusChangeRef.current = onStatusChange;
  pollingFnRef.current = pollingFn;

  const connect = useCallback(() => {
    const token = tokenManager.getAccessToken();
    websocketService.connect(token || undefined);
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const send = useCallback((type: string, payload: unknown) => {
    websocketService.send(type, payload);
  }, []);

  // Status change listener
  useEffect(() => {
    const unsubscribe = websocketService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      onStatusChangeRef.current?.(newStatus);
    });

    return unsubscribe;
  }, []);

  // Message subscription
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const handler: WebSocketEventHandler = (message) => {
      setLastMessage(message);
      onMessageRef.current?.(message);
    };

    if (eventTypes.length === 0) {
      unsubscribers.push(websocketService.subscribeAll(handler));
    } else {
      eventTypes.forEach((type) => {
        unsubscribers.push(websocketService.subscribe(type, handler));
      });
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [eventTypes.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-connect on mount when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      // Only disconnect if no other subscribers remain
      // The service is a singleton, so we just leave it connected
    };
  }, [autoConnect, isAuthenticated, connect]);

  // Fallback polling when WebSocket is disconnected
  useEffect(() => {
    const shouldPoll = pollingInterval > 0 && pollingFnRef.current && status === 'disconnected';

    if (shouldPoll) {
      // Run immediately once
      pollingFnRef.current?.();

      pollingTimerRef.current = setInterval(() => {
        pollingFnRef.current?.();
      }, pollingInterval);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [status, pollingInterval]);

  return {
    status,
    isConnected: status === 'connected',
    lastMessage,
    connect,
    disconnect,
    send,
  };
};

// ============================================================================
// useRealtimeDashboard - Dashboard-specific real-time hook
// ============================================================================

export interface RealtimeTransaction {
  transactionId: string;
  status: string;
  amount?: number;
  currency?: string;
  type?: string;
  referenceId?: string;
  recipientName?: string;
  message: string;
  timestamp: string;
}

export interface UseRealtimeDashboardReturn {
  status: ConnectionStatus;
  isConnected: boolean;
  recentUpdates: RealtimeTransaction[];
  clearUpdates: () => void;
}

export const useRealtimeDashboard = (options?: {
  onNewTransaction?: (transaction: RealtimeTransaction) => void;
  maxUpdates?: number;
}): UseRealtimeDashboardReturn => {
  const { onNewTransaction, maxUpdates = 50 } = options ?? {};
  const [recentUpdates, setRecentUpdates] = useState<RealtimeTransaction[]>([]);
  const onNewTransactionRef = useRef(onNewTransaction);
  onNewTransactionRef.current = onNewTransaction;

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      if (
        message.type === 'transaction.update' ||
        message.type === 'transaction.created' ||
        message.type === 'transaction.completed' ||
        message.type === 'transaction.failed'
      ) {
        const update: RealtimeTransaction = {
          transactionId: message.payload.transactionId,
          status: message.payload.status,
          amount: message.payload.amount,
          currency: message.payload.currency,
          type: message.payload.type,
          referenceId: message.payload.referenceId,
          recipientName: message.payload.recipientName,
          message: message.payload.message || `Transaction ${message.payload.status}`,
          timestamp: message.timestamp,
        };

        setRecentUpdates((prev) => [update, ...prev].slice(0, maxUpdates));
        onNewTransactionRef.current?.(update);
      }
    },
    [maxUpdates]
  );

  const { status, isConnected } = useWebSocket({
    eventTypes: [
      'transaction.update',
      'transaction.created',
      'transaction.completed',
      'transaction.failed',
      'dashboard.stats',
    ],
    onMessage: handleMessage,
  });

  const clearUpdates = useCallback(() => {
    setRecentUpdates([]);
  }, []);

  return {
    status,
    isConnected,
    recentUpdates,
    clearUpdates,
  };
};
