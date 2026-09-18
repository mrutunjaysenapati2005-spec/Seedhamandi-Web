// Real-time Event Service for WebSocket & Server-Sent Events (SSE)
import { Order } from '../types';

export interface RealtimeEvent {
  type: 'order:created' | 'order:status_change' | 'order:updated' | 'connected' | 'ping';
  data?: {
    orderId?: string;
    status?: string;
    note?: string;
    order?: Order;
    message?: string;
    [key: string]: any;
  };
  timestamp: string;
}

type EventListener = (event: RealtimeEvent) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<EventListener> = new Set();
  private isWsActive = false;
  private lastEventTime = 0;
  private reconnectTimer: any = null;
  private initialized = false;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;
    this.connect();
  }

  private connect() {
    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isWsActive = true;
        this.lastEventTime = Date.now();
        this.notifyListeners({
          type: 'connected',
          timestamp: new Date().toISOString(),
          data: { message: 'WebSocket connected' },
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: RealtimeEvent = JSON.parse(event.data);
          this.lastEventTime = Date.now();
          this.notifyListeners(parsed);
        } catch (err) {
          console.error('[RealtimeService] Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isWsActive = false;
        this.startFallbackSse();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isWsActive = false;
        this.startFallbackSse();
      };
    } catch (e) {
      console.warn('[RealtimeService] WebSocket initialization error, starting SSE fallback:', e);
      this.startFallbackSse();
    }
  }

  private startFallbackSse() {
    if (this.eventSource) return;
    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.onopen = () => {
        this.lastEventTime = Date.now();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed: RealtimeEvent = JSON.parse(event.data);
          this.lastEventTime = Date.now();
          this.notifyListeners(parsed);
        } catch (e) {
          // heartbeat
        }
      };

      this.eventSource.addEventListener('order:status_change', (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          this.lastEventTime = Date.now();
          this.notifyListeners(parsed);
        } catch (e) {
          console.error('[RealtimeService] SSE parse error:', e);
        }
      });

      this.eventSource.addEventListener('order:created', (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          this.lastEventTime = Date.now();
          this.notifyListeners(parsed);
        } catch (e) {
          console.error('[RealtimeService] SSE parse error:', e);
        }
      });

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      };
    } catch (e) {
      console.warn('[RealtimeService] EventSource failed:', e);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isWsActive) {
        this.connect();
      }
    }, 4000);
  }

  private notifyListeners(event: RealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[RealtimeService] Listener error:', err);
      }
    });
  }

  public subscribe(listener: EventListener): () => void {
    this.init();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isConnected(): boolean {
    return this.isWsActive || (this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN);
  }

  public getLastEventTime(): number {
    return this.lastEventTime;
  }
}

export const realtimeService = new RealtimeService();
