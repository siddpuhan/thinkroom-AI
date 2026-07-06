// apiConfig.ts - Centralized configuration for frontend API & sockets
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE_URL;
