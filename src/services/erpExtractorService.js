
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const erpExtractorService = {

  async run(mode = 'api') {
    return httpService.post(`${API_ENDPOINTS.ERP_EXTRACTOR.RUN}?mode=${mode}`, null);
  },

  async getPendingDeliveries() {
    return httpService.get(API_ENDPOINTS.ERP_EXTRACTOR.DELIVERIES);
  },

  async getLog() {
    return httpService.get(API_ENDPOINTS.ERP_EXTRACTOR.LOG);
  },
};

export default erpExtractorService;
