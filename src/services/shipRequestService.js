
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

  async pick(requestId, payload) {

    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_PICK(requestId), payload);
  },

  async unpick(requestId, payload) {
    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_UNPICK(requestId), payload);
  },

  async complete(requestId, { mode } = {}) {
    const headers = mode ? { 'X-Generation-Mode': mode } : {};
    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_COMPLETE(requestId), {}, { headers });
  },

  async cancel(requestId) {
    return httpService.delete(API_ENDPOINTS.OPERATIONS.SHIP_REQUEST_BY_ID(requestId));
  },
};

export default shipRequestService;
