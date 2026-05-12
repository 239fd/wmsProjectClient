
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

const documentService = {

  async list({ page = 0, size = 20 } = {}) {
    return httpService.get(`${API_ENDPOINTS.DOCUMENTS.LIST}?page=${page}&size=${size}`);
  },

  async getMetadata(id) {
    return httpService.get(API_ENDPOINTS.DOCUMENTS.METADATA(id));
  },

  getDownloadUrl(id) {
    return `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.BY_ID(id).replace(API_BASE_URL, '')}`;
  },

  async download(id, filename = 'document.pdf') {
    const token = localStorage.getItem('accessToken');
    const url = `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS.BY_ID(id).replace(API_BASE_URL, '')}`;
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
};

export default documentService;
