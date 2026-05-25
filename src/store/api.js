import axios from 'axios';
import { BACKEND_URL as API_BASE_URL } from '../config/api';
import { notifyNetworkError } from '../utils/notifyBridge';

export const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('persist:auth');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (config.headers && config.headers._skipAuth) {
      delete config.headers._skipAuth;
      return config;
    }
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      if (user?.organizationId && !config.headers['X-Organization-Id']) {
        config.headers['X-Organization-Id'] = user.organizationId;
      }
      if (user?.userId && !config.headers['X-User-Id']) {
        config.headers['X-User-Id'] = user.userId;
      }
      if (user?.role && !config.headers['X-User-Role']) {
        config.headers['X-User-Role'] = user.role;
      }
      if (user?.warehouseId && !config.headers['X-Warehouse-Id']) {
        config.headers['X-Warehouse-Id'] = user.warehouseId;
      }
    } catch (e) {
    }
    const generationMode = localStorage.getItem('generationMode');
    if (generationMode && !config.headers['X-Generation-Mode']) {
      config.headers['X-Generation-Mode'] = generationMode;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

const performRefresh = () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
      .then((response) => {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    const isAuthEndpoint = originalRequest.url?.includes('/auth/login')
      || originalRequest.url?.includes('/auth/register')
      || originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await performRefresh();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {

        clearAuthData();
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const onGuestPage = path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/auth/');
          if (!onGuestPage) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    const isNetworkError =
      !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');

    let message = 'Произошла ошибка';
    if (error.response?.data) {
      const data = error.response.data;
      message = data.message || data.error || data.detail
        || (typeof data === 'string' ? data : message);
    } else if (isNetworkError) {
      message = 'Сервер недоступен. Проверьте подключение.';
      notifyNetworkError();
    } else if (error.message) {
      message = error.message;
    }

    if (error.response?.status) {
      console.error(`API Error [${error.response.status}]:`, message);
    }

    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    customError.isNetworkError = isNetworkError;
    return Promise.reject(customError);
  }
);

export default api;
