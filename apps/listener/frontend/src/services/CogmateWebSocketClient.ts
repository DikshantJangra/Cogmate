/**
 * Cogmate WebSocket Client
 * Pipes transcripts from the Listener (Meetily) to the Cogmate Backend.
 */
class CogmateWebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 3000;

  constructor(url: string = 'ws://127.0.0.1:8000/ws/audio') {
    this.url = url;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    console.log('🔗 Connecting to Cogmate Backend WebSocket...');
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log('✅ Connected to Cogmate Backend');
    };

    this.socket.onclose = () => {
      console.log('❌ Disconnected from Cogmate Backend. Retrying...');
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.socket.onerror = (error) => {
      console.error('⚠️ Cogmate WebSocket Error:', error);
    };
  }

  sendTranscript(text: string, isPartial: boolean = false) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ text, is_partial: isPartial, timestamp: new Date().toISOString() }));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const cogmateWS = new CogmateWebSocketClient();
