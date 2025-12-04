// Analytics Service - сервис аналитики
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const analyticsService = {
  async getStockAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams
      ? `${API_ENDPOINTS.ANALYTICS.STOCK}?${queryParams}`
      : API_ENDPOINTS.ANALYTICS.STOCK;
    return httpService.get(url);
  },

  async getOperationsAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams
      ? `${API_ENDPOINTS.ANALYTICS.OPERATIONS}?${queryParams}`
      : API_ENDPOINTS.ANALYTICS.OPERATIONS;
    return httpService.get(url);
  },

  async getWarehouseLoadAnalytics() {
    return httpService.get(API_ENDPOINTS.ANALYTICS.WAREHOUSE_LOAD);
  },

  async getEmployeesAnalytics() {
    return httpService.get(API_ENDPOINTS.ANALYTICS.EMPLOYEES);
  },
};

export default analyticsService;

