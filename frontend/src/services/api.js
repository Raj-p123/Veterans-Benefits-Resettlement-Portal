import axios from 'axios';
import { authStorage } from '../utils/authStorage.js';

/**
 * Determine the API Base URL reliably across all environments:
 * 1. If VITE_API_URL environment variable is provided, use it.
 * 2. If running in browser on local Vite dev ports (5173/3000), use http://localhost:5000/api.
 * 3. In all other cases (e.g. Render production, staging, custom domain), use relative '/api'.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (typeof window !== 'undefined') {
    const port = window.location.port;
    if (port === '5173' || port === '3000') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }

  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout to handle cloud cold-starts comfortably
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    // Ensure baseURL is dynamically resolved if empty
    if (!config.baseURL) {
      config.baseURL = getApiBaseUrl();
    }
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global 401 and Network Errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // If server responded with 401 and we had a token, it may be expired
      if (error.response.status === 401) {
        const isAuthRequest =
          error.config?.url?.includes('/auth/login') ||
          error.config?.url?.includes('/auth/register');
        if (!isAuthRequest) {
          authStorage.clearAuth();
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }

      // Return standardized error format
      const message = error.response.data?.message || 'An unexpected error occurred';
      const customError = new Error(message);
      customError.status = error.response.status;
      customError.data = error.response.data;
      return Promise.reject(customError);
    } else if (error.request) {
      // Network or timeout error
      let message = 'Cannot connect to the server. Please check your connection.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        message = 'Server request timed out. Please try again.';
      }
      const networkError = new Error(message);
      networkError.status = 0;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getMe: () => apiClient.get('/auth/me'),
  testAuth: () => apiClient.get('/auth/test'),
  testRole: (role) => apiClient.get(`/auth/test/${role.toLowerCase()}`),
};

export const systemApi = {
  getHealth: () => apiClient.get('/health'),
};

export default apiClient;
