
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { storage } from './storage';

/**
 * Returns environment-driven API base URL.
 *
 * Production:
 * Uses VITE_API_BASE_URL from Vercel.
 *
 * Native Android:
 * Uses Android emulator host alias.
 *
 * Local Web:
 * Uses Vite proxy.
 */
export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (Capacitor.isNativePlatform()) {
    return 'http://10.0.2.2:8080/api/v1';
  }

  return '/api/v1';
};

/**
 * Returns environment-driven WebSocket broker URL.
 *
 * Production:
 * Uses VITE_WS_URL from Vercel.
 *
 * Native Android:
 * Uses Android emulator host alias.
 *
 * Local Web:
 * Uses local Spring Boot server.
 */
export const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  if (Capacitor.isNativePlatform()) {
    return 'ws://10.0.2.2:8080/ws';
  }

  return 'ws://localhost:8080/ws';
};

// API base URL
export const API_BASE_URL = getApiBaseUrl();

// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT access token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('access_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token handling
let isRefreshing = false;

let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Do not refresh tokens for login or registration
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register')
      ) {
        return Promise.reject(
          error.response?.data?.message || 'Authentication failed'
        );
      }

      // Queue requests while another refresh is running
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await storage.getItem('refresh_token');

      if (!refreshToken) {
        await storage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response: any = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {
            refreshToken,
          }
        );

        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;

        // Save new tokens
        await storage.setItem('access_token', newAccessToken);
        await storage.setItem('refresh_token', newRefreshToken);

        // Update default authorization header
        apiClient.defaults.headers.common.Authorization =
          `Bearer ${newAccessToken}`;

        // Resolve queued requests
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);

      } catch (refreshErr) {
        processQueue(refreshErr, null);

        await storage.clear();
        window.location.href = '/login';

        return Promise.reject(refreshErr);

      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Network request failed. Please check your connection.';

    return Promise.reject(new Error(message));
  }
);
