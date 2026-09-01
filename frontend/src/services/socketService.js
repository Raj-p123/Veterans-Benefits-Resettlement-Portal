import { io } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

/**
 * Determine the Socket.IO server URL reliably across environments:
 * 1. If VITE_SOCKET_URL is set, use it.
 * 2. If running on local Vite dev ports (5173/3000), connect to http://localhost:5000.
 * 3. In all other cases (e.g. Render production), connect to window.location.origin on the same domain.
 */
export const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined') {
    const port = window.location.port;
    if (port === '5173' || port === '3000') {
      return 'http://localhost:5000';
    }
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

class SocketService {
  constructor() {
    this.socket = null;
    this.token = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server with JWT auth
   */
  connect(token) {
    if (!token) {
      console.warn('[SocketService] Connect skipped: Token is missing.');
      return null;
    }

    if (this.socket && this.isConnected && this.token === token) {
      return this.socket;
    }

    if (this.socket) {
      this.disconnect();
    }

    this.token = token;
    const socketUrl = getSocketUrl();

    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`[Socket.IO Client] Connected to server (${this.socket.id})`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[Socket.IO Client] Connection error:', error.message);
      this.isConnected = false;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('[Socket.IO Client] Disconnected:', reason);
    });

    return this.socket;
  }

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.token = null;
      console.log('[Socket.IO Client] Socket connection closed cleanly.');
    }
  }

  /**
   * Listen to an event
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Join an authorized room (e.g. job:<jobId>)
   */
  joinRoom(roomName) {
    if (this.socket && this.isConnected) {
      this.socket.emit(SOCKET_EVENTS.JOIN_ROOM, roomName);
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(roomName) {
    if (this.socket && this.isConnected) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, roomName);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
