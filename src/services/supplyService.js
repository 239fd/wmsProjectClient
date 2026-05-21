
import httpService from './httpService';
import api from '../store/api';
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

  async update(id, payload) {
    return httpService.put(API_ENDPOINTS.SUPPLIES.BY_ID(id), payload);
  },

  async setStatus(id, status, userId = null) {
    return httpService.patch(API_ENDPOINTS.SUPPLIES.STATUS(id), { status, userId });
  },

  async cancel(id) {
    return httpService.delete(API_ENDPOINTS.SUPPLIES.BY_ID(id));
  },

  async importFrom1c({ warehouseId, userId } = {}) {
    const headers = {};
    if (warehouseId) headers['X-Warehouse-Id'] = String(warehouseId);
    if (userId) headers['X-User-Id'] = String(userId);
    return httpService.post(API_ENDPOINTS.SUPPLIES.IMPORT_1C, {}, { headers });
  },

  async importFromJson(file, { warehouseId, userId } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (warehouseId) headers['X-Warehouse-Id'] = String(warehouseId);
    if (userId) headers['X-User-Id'] = String(userId);
    return httpService.postFormData(API_ENDPOINTS.SUPPLIES.IMPORT_JSON, formData, { headers });
  },

  async downloadSampleJson() {
    const response = await api.get(API_ENDPOINTS.SUPPLIES.SAMPLE_JSON, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'sample-supply.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },
};

export default supplyService;
