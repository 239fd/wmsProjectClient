// Auth Service - сервис аутентификации
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const authService = {
  async login(email, password) {
    const response = await httpService.post(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password },
      { includeAuth: false }
    );

    if (response.accessToken) {
      httpService.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  async register(userData) {

    const response = await httpService.post(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
      { includeAuth: false }
    );

    if (response.accessToken) {
      httpService.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  async logout() {
    try {
      await httpService.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      httpService.clearTokens();
    }
  },

  async refreshToken() {
    return httpService.refreshAccessToken();
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  // OAuth методы
  getGoogleAuthUrl() {
    return API_ENDPOINTS.OAUTH.GOOGLE;
  },

  getYandexAuthUrl() {
    return API_ENDPOINTS.OAUTH.YANDEX;
  },

  async completeOAuthRegistration(token, role) {
    const response = await httpService.post(
      API_ENDPOINTS.OAUTH.COMPLETE_REGISTRATION,
      { token, role },
      { includeAuth: false }
    );

    if (response.accessToken) {
      httpService.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },
};

export default authService;

