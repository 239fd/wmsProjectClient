
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const supplyService = {
  async list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${API_ENDPOINTS.SUPPLIES.BASE}?${qs}` : API_ENDPOINTS.SUPPLIES.BASE;
    return httpService.get(url);
  },

  async get(id) {
    return httpService.get(API_ENDPOINTS.SUPPLIES.BY_ID(id));
  },

  async create(payload) {

    return httpService.post(API_ENDPOINTS.SUPPLIES.BASE, payload);
  },

  async setStatus(id, status, userId = null) {
    return httpService.patch(API_ENDPOINTS.SUPPLIES.STATUS(id), { status, userId });
  },

  async cancel(id) {
    return httpService.delete(API_ENDPOINTS.SUPPLIES.BY_ID(id));
  },
};

export default supplyService;
