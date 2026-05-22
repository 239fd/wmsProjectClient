
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

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
    try {
      const { url } = await httpService.get(API_ENDPOINTS.DOCUMENT_REGISTRY.PRESIGNED_URL(id));
      if (!url) throw new Error('Сервер не вернул ссылку на документ');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      throw new Error(err?.message || 'Не удалось скачать документ');
    }
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
