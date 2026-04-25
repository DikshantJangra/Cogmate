/**
 * Cogmate WebSocket Client
 * Pipes transcripts from the Listener to the Cogmate Backend /ws/audio endpoint.
 */

const DEFAULT_URL = process.env.NEXT_PUBLIC_COGMATE_WS_URL?.replace('/ws/ui', '/ws/audio')
  ?? 'ws://127.0.0.1:8000/ws/audio';

class CogmateWebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private retryDelay = 2000;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(url: string = DEFAULT_URL) {
    this.url = url;
  }

  connect() {
    if (this.destroyed) return;
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('✅ Cogmate WS connected');
      this.retryDelay = 2000; // reset backoff
    };

    this.socket.onclose = () => {
      if (this.destroyed) return;
      console.log(`❌ Cogmate WS closed. Retrying in ${this.retryDelay}ms…`);
      this.retryTimer = setTimeout(() => this.connect(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 1.5, 30000);
    };

    this.socket.onerror = () => this.socket?.close();
  }

  sendTranscript(text: string, isPartial = false, topic?: string) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({
      text,
      is_partial: isPartial,
      timestamp: new Date().toISOString(),
      ...(topic ? { topic } : {}),
    }));
  }

  setTopic(topic: string) {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'set_topic', topic }));
  }

  disconnect() {
    this.destroyed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.close();
    this.socket = null;
  }
}

export const cogmateWS = new CogmateWebSocketClient();
