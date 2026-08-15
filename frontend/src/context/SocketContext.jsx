import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import { authStorage } from '../utils/authStorage';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token: authToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = authToken || authStorage.getToken();

    if (isAuthenticated && token) {
      const socket = socketService.connect(token);
      if (socket) {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        setIsConnected(socket.connected);

        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
        };
      }
    } else {
      socketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, authToken]);

  const value = {
    socket: socketService.socket,
    isConnected,
    joinRoom: (room) => socketService.joinRoom(room),
    leaveRoom: (room) => socketService.leaveRoom(room),
    on: (event, cb) => socketService.on(event, cb),
    off: (event, cb) => socketService.off(event, cb),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
