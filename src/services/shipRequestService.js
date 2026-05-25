
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const shipRequestService = {
  async list({ page = 0, size = 1000, sort } = {}) {
    const params = { page, size };
    if (sort) params.sort = sort;
    return httpService.get(API_ENDPOINTS.OPERATIONS.SHIP_REQUESTS, { params });
  },

  async get(requestId) {
    return httpService.get(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_BY_ID(requestId));
  },

  async create(payload) {

    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUESTS, payload);
  },

  async addItems(requestId, items) {
    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_ITEMS(requestId), { items });
  },

  async pick(requestId, payload) {

    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_PICK(requestId), payload);
  },

  async unpick(requestId, payload) {
    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_UNPICK(requestId), payload);
  },

  async complete(requestId, { mode, manualFields } = {}) {
    const headers = mode ? { 'X-Generation-Mode': mode } : {};
    return httpService.post(
      API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_COMPLETE(requestId),
      manualFields || {},
      { headers }
    );
  },

  async cancel(requestId) {
    return httpService.delete(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_BY_ID(requestId));
  },

  async importFrom1c({ warehouseId, userId } = {}) {
    const headers = {};
    if (warehouseId) headers['X-Warehouse-Id'] = String(warehouseId);
    if (userId) headers['X-User-Id'] = String(userId);
    return httpService.post(`${API_ENDPOINTS.OPERATIONS.SHIP_REQUESTS}/import-1c`, {}, { headers });
  },
};

export default shipRequestService;
