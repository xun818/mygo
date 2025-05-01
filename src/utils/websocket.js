// C:\mygo-learning-platform\src\utils\websocket.js
export function createWebSocket() {
  const ws = new WebSocket('ws://localhost:3001/ws');
  ws.onopen    = () => console.log('🔌 WS connected');
  ws.onmessage = e => console.log('📨 from server:', e.data);
  ws.onclose   = () => console.log('❌ WS closed');
  ws.onerror   = err => console.error('⚠️ WS error', err);
  return ws;
}
