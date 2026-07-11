// apiConfig.ts - Centralized configuration for frontend API & sockets
// API calls go through Next.js proxy (rewrites in next.config.js) to avoid CORS
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
// Socket.IO connects directly to backend for real-time WebSocket transport
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
