// Product Service - сервис работы с товарами
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const productService = {
  // Products
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
    // productData: { sku, name, description, categoryId, unit, shelfLifeDays, barcode }
    return httpService.post(API_ENDPOINTS.PRODUCTS.BASE, productData);
  },

  async updateProduct(id, productData) {
    return httpService.put(API_ENDPOINTS.PRODUCTS.BY_ID(id), productData);
  },

  async deleteProduct(id) {
    return httpService.delete(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },

  // Batches
  async getBatchesByProduct(productId) {
    return httpService.get(API_ENDPOINTS.BATCHES.BY_PRODUCT(productId));
  },

  async createBatch(batchData) {
    return httpService.post(API_ENDPOINTS.BATCHES.BASE, batchData);
  },

  // Operations
  async receiveProduct(receiveData) {
    // receiveData: { productId, warehouseId, rackId, placeId, quantity, batchNumber, expiryDate, pricePerUnit }
    return httpService.post(API_ENDPOINTS.OPERATIONS.RECEIVE, receiveData);
  },

  async shipProduct(shipData) {
    // shipData: { productId, warehouseId, quantity, documentNumber }
    return httpService.post(API_ENDPOINTS.OPERATIONS.SHIP, shipData);
  },

  async transferProduct(transferData) {
    // transferData: { batchId, fromWarehouseId, fromRackId, toWarehouseId, toRackId, quantity }
    return httpService.post(API_ENDPOINTS.OPERATIONS.TRANSFER, transferData);
  },

  async reserveProduct(reserveData) {
    return httpService.post(API_ENDPOINTS.OPERATIONS.RESERVE, reserveData);
  },

  async getOperationsHistory(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams
      ? `${API_ENDPOINTS.OPERATIONS.HISTORY}?${queryParams}`
      : API_ENDPOINTS.OPERATIONS.HISTORY;
    return httpService.get(url);
  },

  // Inventory
  async getInventory(warehouseId) {
    return httpService.get(API_ENDPOINTS.INVENTORY.BY_WAREHOUSE(warehouseId));
  },

  async writeOff(writeOffData) {
    // writeOffData: { batchId, quantity, reason, documentNumber }
    return httpService.post(API_ENDPOINTS.INVENTORY.WRITEOFF, writeOffData);
  },

  async revaluate(revaluationData) {
    // revaluationData: { batchId, oldPrice, newPrice, reason, documentNumber }
    return httpService.post(API_ENDPOINTS.INVENTORY.REVALUATION, revaluationData);
  },

  // Inventory Check (Инвентаризация)
  async startInventoryCheck(warehouseId) {
    return httpService.post(API_ENDPOINTS.INVENTORY_CHECK.START, { warehouseId });
  },

  async completeInventoryCheck(sessionId) {
    return httpService.post(API_ENDPOINTS.INVENTORY_CHECK.COMPLETE, { sessionId });
  },

  async recordInventoryCount(countData) {
    // countData: { sessionId, batchId, countedQuantity }
    return httpService.post(API_ENDPOINTS.INVENTORY_CHECK.COUNT, countData);
  },

  async getInventorySessions() {
    return httpService.get(API_ENDPOINTS.INVENTORY_CHECK.SESSIONS);
  },
};

export default productService;

