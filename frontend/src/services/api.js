import axios from 'axios';
import { authStorage } from '../utils/authStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
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

// Response Interceptor: Handle Global 401
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // If server responded with 401 and we had a token, it may be expired
      if (error.response.status === 401) {
        const isAuthRequest = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
        if (!isAuthRequest) {
          authStorage.clearAuth();
          // Dispatch custom event for app-level handling
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
      const networkError = new Error('Cannot connect to the server. Please check your connection.');
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
