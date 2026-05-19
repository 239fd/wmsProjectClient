
import httpService from './httpService';
import { API_ENDPOINTS, BACKEND_URL as API_BASE_URL } from '../config/api';

const documentService = {

  async list({ page = 0, size = 20, sort = 'generatedAt,desc', type } = {}) {
    const params = { page, size, sort };
    if (type) params.type = type;
    return httpService.get(API_ENDPOINTS.DOCUMENT_REGISTRY.LIST, { params });
  },

  async getMetadata(id) {
    return httpService.get(API_ENDPOINTS.DOCUMENT_REGISTRY.BY_ID(id));
  },

  async getByOperation(operationId) {
    return httpService.get(API_ENDPOINTS.DOCUMENT_REGISTRY.BY_OPERATION(operationId));
  },

  async getPresignedUrl(id) {
    return httpService.get(API_ENDPOINTS.DOCUMENT_REGISTRY.PRESIGNED_URL(id));
  },

  async download(id, filename = 'document.pdf') {
    const token = localStorage.getItem('accessToken');
    const url = API_ENDPOINTS.DOCUMENT_REGISTRY.DOWNLOAD(id);
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      throw new Error(`Не удалось скачать документ: HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },

  async generate(type, data, format = 'pdf') {
    const url = `${API_ENDPOINTS.DOCUMENTS.GENERATE(type)}?format=${encodeURIComponent(format)}`;
    return httpService.post(url, data);
  },

  async getRpaHealth() {
    return httpService.get(API_ENDPOINTS.DOCUMENTS.RPA_HEALTH);
  },
};

export default documentService;
