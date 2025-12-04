// HTTP Service - базовый сервис для работы с API
import { API_ENDPOINTS } from '../config/api';

class HttpService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  getHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (includeAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async request(url, options = {}) {
    const { includeAuth = true, ...fetchOptions } = options;

    let response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.getHeaders(includeAuth, fetchOptions.headers?.['Content-Type']),
          ...fetchOptions.headers,
        },
        credentials: 'include',
      });
    } catch (networkError) {
      // Сетевая ошибка (бэкенд недоступен)
      throw new Error('Сервер недоступен. Проверьте подключение.');
    }

    // Если токен истёк, пробуем обновить
    if (response.status === 401 && this.refreshToken && includeAuth) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Повторяем запрос с новым токеном
        try {
          return await fetch(url, {
            ...fetchOptions,
            headers: {
              ...this.getHeaders(includeAuth, fetchOptions.headers?.['Content-Type']),
              ...fetchOptions.headers,
            },
            credentials: 'include',
          });
        } catch (networkError) {
          throw new Error('Сервер недоступен. Проверьте подключение.');
        }
      } else {
        // Рефреш не удался — разлогиниваем
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    return response;
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  async get(url, options = {}) {
    const response = await this.request(url, { ...options, method: 'GET' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async post(url, data, options = {}) {
    const response = await this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    // Некоторые POST-запросы могут не возвращать тело
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async put(url, data, options = {}) {
    const response = await this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async delete(url, options = {}) {
    const response = await this.request(url, { ...options, method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return true;
  }

  async postFormData(url, formData, options = {}) {
    const response = await this.request(url, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {}, // Не устанавливаем Content-Type для FormData
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // Скачивание файла (для документов)
  async downloadFile(url, filename) {
    const response = await this.request(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Экспортируем синглтон
const httpService = new HttpService();
export default httpService;

