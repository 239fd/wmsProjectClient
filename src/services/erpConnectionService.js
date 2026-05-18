import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const erpConnectionService = {

  async list() {
    return httpService.get(API_ENDPOINTS.ERP_CONNECTIONS.BASE);
  },

  async get(id) {
    return httpService.get(API_ENDPOINTS.ERP_CONNECTIONS.BY_ID(id));
  },

  async create(payload) {
    return httpService.post(API_ENDPOINTS.ERP_CONNECTIONS.BASE, payload);
  },

  async update(id, payload) {
    return httpService.put(API_ENDPOINTS.ERP_CONNECTIONS.BY_ID(id), payload);
  },

  async remove(id) {
    return httpService.delete(API_ENDPOINTS.ERP_CONNECTIONS.BY_ID(id));
  },

  async setDefault(id) {
    return httpService.patch(API_ENDPOINTS.ERP_CONNECTIONS.SET_DEFAULT(id));
  },
};

export default erpConnectionService;
