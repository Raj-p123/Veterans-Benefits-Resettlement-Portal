import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authStorage } from '../utils/authStorage.js';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [token, setToken] = useState(() => authStorage.getToken());
  const [loading, setLoading] = useState(true);

  // Restore and verify user session from backend on initial mount
  const verifySession = useCallback(async () => {
    const storedToken = authStorage.getToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
        authStorage.setUser(response.data.user);
      }
    } catch (error) {
      console.warn('[AuthContext] Stored session invalid or expired:', error.message);
      authStorage.clearAuth();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();

    // Listen for global unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      authStorage.clearAuth();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [verifySession]);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    if (response && response.data) {
      const { user: loggedInUser, token: receivedToken } = response.data;
      authStorage.setToken(receivedToken);
      authStorage.setUser(loggedInUser);
      setToken(receivedToken);
      setUser(loggedInUser);
      return loggedInUser;
    }
    throw new Error('Invalid login response from server');
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    if (response && response.data) {
      const { user: newUser, token: receivedToken } = response.data;
      authStorage.setToken(receivedToken);
      authStorage.setUser(newUser);
      setToken(receivedToken);
      setUser(newUser);
      return newUser;
    }
    throw new Error('Invalid registration response from server');
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
        authStorage.setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
