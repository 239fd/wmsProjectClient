
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const productService = {

  async getProducts() {
    return httpService.get(API_ENDPOINTS.PRODUCTS.BASE);
  },

  async getProduct(id) {
    return httpService.get(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },

  async searchProducts(query) {
    return httpService.get(`${API_ENDPOINTS.PRODUCTS.SEARCH}?query=${encodeURIComponent(query)}`);
  },

  async createProduct(productData) {

    return httpService.post(API_ENDPOINTS.PRODUCTS.BASE, productData);
  },

  async updateProduct(id, productData) {
    return httpService.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), productData);
  },

  async deleteProduct(id) {
    return httpService.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },


  async getBatchesByProduct(productId) {
    return httpService.get(API_ENDPOINTS.BATCHES.BY_PRODUCT(productId));
  },

  async createBatch(batchData) {
    return httpService.post(API_ENDPOINTS.BATCHES.BASE, batchData);
  },


  async createReceiptSession(payload) {
    return httpService.post(API_ENDPOINTS.RECEIPT_SESSIONS.BASE, payload);
  },

  async completeReceiptSession(sessionId) {
    return httpService.post(API_ENDPOINTS.RECEIPT_SESSIONS.COMPLETE(sessionId), {});
  },

  async recordSessionDiscrepancy(sessionId, payload) {
    return httpService.post(API_ENDPOINTS.RECEIPT_SESSIONS.DISCREPANCY(sessionId), payload);
  },

  async listReceiptSessions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs
      ? `${API_ENDPOINTS.RECEIPT_SESSIONS.BASE}?${qs}`
      : API_ENDPOINTS.RECEIPT_SESSIONS.BASE;
    return httpService.get(url);
  },

  async getReceiptSession(sessionId) {
    return httpService.get(API_ENDPOINTS.RECEIPT_SESSIONS.BY_ID(sessionId));
  },

  async transferProduct(transferData) {
    return httpService.post(API_ENDPOINTS.OPERATIONS.TRANSFER, transferData);
  },

  async getOperationsHistory(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams
      ? `${API_ENDPOINTS.OPERATIONS.HISTORY}?${queryParams}`
      : API_ENDPOINTS.OPERATIONS.HISTORY;
    return httpService.get(url);
  },


  async getInventory(warehouseId) {
    return httpService.get(API_ENDPOINTS.INVENTORY.BY_WAREHOUSE(warehouseId));
  },

  async getInventoryByProduct(productId) {
    return httpService.get(API_ENDPOINTS.INVENTORY.BY_PRODUCT(productId));
  },


  async writeOff(payload) {

    return httpService.post(API_ENDPOINTS.OPERATIONS.WRITE_OFF, payload);
  },

  async getMarkedForWriteOff(warehouseId) {
    const qs = warehouseId ? `?warehouseId=${warehouseId}` : '';
    return httpService.get(`${API_ENDPOINTS.OPERATIONS.WRITE_OFF_MARKED}${qs}`);
  },

  async revaluate(payload) {

    return httpService.post(API_ENDPOINTS.OPERATIONS.REVALUATE, payload);
  },


  async startInventoryCheck({ warehouseId, userId, notes }) {
    const qs = new URLSearchParams();
    qs.set('warehouseId', warehouseId);
    qs.set('userId', userId);
    if (notes) qs.set('notes', notes);
    return httpService.post(`${API_ENDPOINTS.INVENTORY_CHECK.START}?${qs.toString()}`, null);
  },

  async startInventoryCheckStructured(payload) {

    return httpService.post(API_ENDPOINTS.INVENTORY_CHECK.START_STRUCTURED, payload);
  },

  async getInventorySession(sessionId) {
    return httpService.get(API_ENDPOINTS.INVENTORY_CHECK.BY_ID(sessionId));
  },

  async recordInventoryCount(sessionId, { productId, cellId, actualQuantity, notes }) {
    const qs = new URLSearchParams();
    qs.set('productId', productId);
    if (cellId) qs.set('cellId', cellId);
    qs.set('actualQuantity', actualQuantity);
    if (notes) qs.set('notes', notes);
    return httpService.post(`${API_ENDPOINTS.INVENTORY_CHECK.RECORD(sessionId)}?${qs.toString()}`, null);
  },

  async completeInventoryCheck(sessionId, userId) {
    return httpService.post(`${API_ENDPOINTS.INVENTORY_CHECK.COMPLETE(sessionId)}?userId=${userId}`, null);
  },

  async cancelInventoryCheck(sessionId) {
    return httpService.post(API_ENDPOINTS.INVENTORY_CHECK.CANCEL(sessionId), null);
  },
};

export default productService;

