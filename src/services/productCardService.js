import httpService from './httpService';
import api from '../store/api';
import { API_ENDPOINTS } from '../config/api';
import { readFilenameFromResponse } from '../utils/contentDisposition';

const productCardService = {
  async getCard(productId) {
    return httpService.get(API_ENDPOINTS.PRODUCT_CARD.BY_ID(productId));
  },

  async downloadPdf(productId, filename) {
    const response = await api.get(API_ENDPOINTS.PRODUCT_CARD.PDF(productId), {
      responseType: 'blob',
    });
    const fallback = filename || `product-card-${String(productId).slice(0, 8)}.pdf`;
    const effective = readFilenameFromResponse(response, fallback);
    const blobUrl = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = effective;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },
};

export default productCardService;
