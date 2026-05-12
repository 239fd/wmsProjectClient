
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const supplierService = {

  async list({ page = 0, size = 1000, sort } = {}) {
    const params = { page, size };
    if (sort) params.sort = sort;
    return httpService.get(API_ENDPOINTS.SUPPLIERS.BASE, { params });
  },

  async get(id) {
    return httpService.get(API_ENDPOINTS.SUPPLIERS.BY_ID(id));
  },

  async create(payload) {

    return httpService.post(API_ENDPOINTS.SUPPLIERS.BASE, payload);
  },

  async update(id, payload) {
    return httpService.put(API_ENDPOINTS.SUPPLIERS.BY_ID(id), payload);
  },

  async delete(id) {
    return httpService.delete(API_ENDPOINTS.SUPPLIERS.BY_ID(id));
  },
};

export default supplierService;
