import type { WebSocketMessage } from '@/types';

// ============================================================================
// WebSocket Service - Real-Time Connection Manager
// ============================================================================

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

interface WebSocketServiceConfig {
  url: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
  protocols?: string[];
}

const DEFAULT_CONFIG: WebSocketServiceConfig = {
  url: import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
  reconnectAttempts: 10,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketServiceConfig;
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Map<string, Set<WebSocketEventHandler>>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private _status: ConnectionStatus = 'disconnected';
  private intentionalClose = false;

  constructor(config: Partial<WebSocketServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  connect(token?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.intentionalClose = false;
    this.setStatus('connecting');

    const url = token
      ? `${this.config.url}?token=${encodeURIComponent(token)}`
      : this.config.url;

    try {
      this.ws = new WebSocket(url, this.config.protocols);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch {
      this.setStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.cleanup();
    this.setStatus('disconnected');
  }

  subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.listeners.get(eventType)?.delete(handler);
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  subscribeAll(handler: WebSocketEventHandler): () => void {
    return this.subscribe('*', handler);
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  send(type: string, payload: unknown): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(message));
  }

  private handleOpen(): void {
    this.reconnectCount = 0;
    this.setStatus('connected');
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    let message: WebSocketMessage;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    // Ignore heartbeat acknowledgements
    if (message.type === 'pong') return;

    // Notify type-specific listeners
    const handlers = this.listeners.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }

    // Notify wildcard listeners
    const allHandlers = this.listeners.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message));
    }
  }

  private handleClose(): void {
    this.stopHeartbeat();

    if (this.intentionalClose) {
      this.setStatus('disconnected');
      return;
    }

    this.scheduleReconnect();
  }

  private handleError(): void {
    // WebSocket errors are followed by a close event, so reconnection
    // is handled in handleClose
  }

  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts) {
      this.setStatus('disconnected');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectCount++;

    // Exponential backoff with jitter
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(1.5, this.reconnectCount - 1),
      30000
    ) + Math.random() * 1000;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', {});
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
