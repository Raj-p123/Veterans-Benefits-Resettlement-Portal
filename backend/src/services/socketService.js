import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { User } from '../models/User.js';
import { SOCKET_EVENTS } from '../constants/socketEvents.js';

class SocketService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.IO with HTTP server and CORS configuration
   */
  init(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const envOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_URL || config.clientUrl || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const allowedOrigins = Array.from(new Set([
            ...envOrigins,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
          ])).filter(Boolean);

          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }

          try {
            const originUrl = new URL(origin);
            if (
              originUrl.hostname.endsWith('onrender.com') ||
              originUrl.hostname === 'localhost' ||
              originUrl.hostname === '127.0.0.1'
            ) {
              return callback(null, true);
            }
          } catch (e) {
            // Ignore format error
          }

          if (config.nodeEnv === 'development') {
            return callback(null, true);
          }

          return callback(null, false);
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication Middleware
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace(/^Bearer\s+/, '') ||
          socket.handshake.query?.token;

        if (!token) {
          return next(new Error('Authentication error: Token missing.'));
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const userId = decoded?.userId || decoded?.id || decoded?._id;
        if (!decoded || !userId) {
          return next(new Error('Authentication error: Invalid token payload.'));
        }

        const user = await User.findById(userId).select('-password');
        if (!user || !user.isActive) {
          return next(new Error('Authentication error: User not found or inactive.'));
        }

        socket.user = {
          _id: user._id.toString(),
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };

        next();
      } catch (err) {
        console.error('[Socket.IO Auth Error]:', err.message);
        return next(new Error(`Authentication failed: ${err.message}`));
      }
    });

    // Connection Handler
    this.io.on('connection', (socket) => {
      const user = socket.user;
      const userRoom = `user:${user.id}`;
      const roleRoom = `role:${user.role}`;

      socket.join(userRoom);
      socket.join(roleRoom);

      console.log(
        `[Socket.IO] User Connected: ${user.name} (${user.role}) | Socket ID: ${socket.id} | Joined Rooms: [${userRoom}, ${roleRoom}]`
      );

      // Handle custom authorized room joining (e.g. job:<jobId>, application:<applicationId>)
      socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName) => {
        if (!roomName || typeof roomName !== 'string') return;

        // Security check: Only allow authorized room prefixes
        if (
          roomName.startsWith('job:') ||
          roomName.startsWith('application:') ||
          roomName === `role:${user.role}` ||
          roomName === `user:${user.id}`
        ) {
          socket.join(roomName);
          console.log(`[Socket.IO] Socket ${socket.id} joined room: ${roomName}`);
        } else {
          console.warn(
            `[Socket.IO Security Alert] User ${user.id} tried to join unauthorized room: ${roomName}`
          );
        }
      });

      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomName) => {
        if (roomName && typeof roomName === 'string') {
          socket.leave(roomName);
          console.log(`[Socket.IO] Socket ${socket.id} left room: ${roomName}`);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket.IO] User Disconnected: ${user.name} (${user.id}) | Reason: ${reason}`);
      });
    });

    console.log('[Socket.IO] Real-Time Socket Server initialized successfully.');
    return this.io;
  }

  /**
   * Emit event to a specific user's private room
   */
  emitToUser(userId, event, data) {
    if (!this.io) return;
    const targetRoom = `user:${userId.toString()}`;
    this.io.to(targetRoom).emit(event, data);
    console.log(`[Socket.IO Emit → User] Room: ${targetRoom} | Event: ${event}`);
  }

  /**
   * Emit event to all users with a specific role
   */
  emitToRole(role, event, data) {
    if (!this.io) return;
    const targetRoom = `role:${role}`;
    this.io.to(targetRoom).emit(event, data);
    console.log(`[Socket.IO Emit → Role] Room: ${targetRoom} | Event: ${event}`);
  }

  /**
   * Emit event to a specific room (e.g. job:<jobId>)
   */
  emitToRoom(room, event, data) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
    console.log(`[Socket.IO Emit → Room] Room: ${room} | Event: ${event}`);
  }

  /**
   * Broadcast event globally to all connected sockets
   */
  broadcast(event, data) {
    if (!this.io) return;
    this.io.emit(event, data);
    console.log(`[Socket.IO Broadcast] Event: ${event}`);
  }
}

export const socketService = new SocketService();
export default socketService;
