import { STORAGE_KEYS } from '../constants/index.js';

/**
 * Client-Side Authentication Storage Utility
 * 
 * Note on Security Architecture:
 * Storing JWT tokens in localStorage allows state persistence across browser reloads
 * and straightforward Authorization header attachment for REST APIs.
 * Sensitive operations (password updates, admin privileges) are rigorously verified server-side.
 */

export const authStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.warn('Unable to read token from localStorage', e);
      return null;
    }
  },

  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
      }
    } catch (e) {
      console.warn('Unable to write token to localStorage', e);
    }
  },

  removeToken: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (e) {
      console.warn('Unable to remove token from localStorage', e);
    }
  },

  getUser: () => {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.warn('Unable to read user from localStorage', e);
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.warn('Unable to write user to localStorage', e);
    }
  },

  removeUser: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.warn('Unable to remove user from localStorage', e);
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.warn('Unable to clear auth storage', e);
    }
  },

  isAuthenticated: () => {
    return !!authStorage.getToken();
  },
};
