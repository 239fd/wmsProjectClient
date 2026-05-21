
import httpService from './httpService';
import api from '../store/api';
import { API_ENDPOINTS } from '../config/api';
import { readFilenameFromResponse } from '../utils/contentDisposition';

const analyticsService = {

  async getInventoryAnalytics() {
    return httpService.get(API_ENDPOINTS.ANALYTICS.INVENTORY);
  },

  async getOperationsDynamics(startDate, endDate) {
    const url = `${API_ENDPOINTS.ANALYTICS.OPERATIONS_DYNAMICS}?startDate=${startDate}&endDate=${endDate}`;
    return httpService.get(url);
  },

  async getOperationsComparison(startDate, endDate) {
    const url = `${API_ENDPOINTS.ANALYTICS.OPERATIONS_COMPARE}?startDate=${startDate}&endDate=${endDate}`;
    return httpService.get(url);
  },

  async getInventoryComparison(startDate, endDate) {
    const url = `${API_ENDPOINTS.ANALYTICS.INVENTORY_COMPARE}?startDate=${startDate}&endDate=${endDate}`;
    return httpService.get(url);
  },

  async getOperationsSummary() {
    return httpService.get(API_ENDPOINTS.ANALYTICS.OPERATIONS_SUMMARY);
  },

  async getAllWarehousesAnalytics() {
    return httpService.get(API_ENDPOINTS.ANALYTICS.WAREHOUSES_ALL);
  },

  async getWarehouseAnalytics(warehouseId) {
    return httpService.get(API_ENDPOINTS.ANALYTICS.WAREHOUSE_BY_ID(warehouseId));
  },

  async getWarehousesOrgSummary(orgId) {
    return httpService.get(API_ENDPOINTS.ANALYTICS.WAREHOUSES_ORG_SUMMARY(orgId));
  },

  async getEmployeesAnalytics(orgId) {
    return httpService.get(API_ENDPOINTS.ANALYTICS.EMPLOYEES_BY_ORG(orgId));
  },

  async getAbcDistribution() {
    return httpService.get(API_ENDPOINTS.ANALYTICS.ABC_DISTRIBUTION);
  },

  async getExpiringProducts(withinDays = 30) {
    const url = `${API_ENDPOINTS.ANALYTICS.EXPIRING_PRODUCTS}?withinDays=${withinDays}`;
    return httpService.get(url);
  },

  async generateReport(request, fallbackFilename = 'analytics-report.pdf') {
    const response = await api.post(API_ENDPOINTS.ANALYTICS.REPORT, request, {
      responseType: 'blob',
    });
    const filename = readFilenameFromResponse(response, fallbackFilename);
    const blobUrl = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    return {
      documentId: response.headers?.['x-document-id'] || null,
      documentNumber: response.headers?.['x-document-number'] || null,
      filename,
    };
  },
};

export default analyticsService;
