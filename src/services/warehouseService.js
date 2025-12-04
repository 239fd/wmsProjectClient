// Warehouse Service - сервис работы со складами
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const warehouseService = {
  // Warehouses
  async getWarehouses() {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.BASE);
  },

  async getWarehousesByOrg(orgId) {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.BY_ORG(orgId));
  },

  async getWarehouse(id) {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.BY_ID(id));
  },

  async createWarehouse(warehouseData) {
    // warehouseData: { name, address, orgId, responsibleUserId }
    return httpService.post(API_ENDPOINTS.WAREHOUSES.BASE, warehouseData);
  },

  async updateWarehouse(id, warehouseData) {
    return httpService.put(API_ENDPOINTS.WAREHOUSES.BY_ID(id), warehouseData);
  },

  async deleteWarehouse(id) {
    return httpService.delete(API_ENDPOINTS.WAREHOUSES.BY_ID(id));
  },

  async getWarehouseAnalytics() {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.ANALYTICS);
  },

  // Racks
  async getRacksByWarehouse(warehouseId) {
    return httpService.get(API_ENDPOINTS.RACKS.BY_WAREHOUSE(warehouseId));
  },

  async getRack(id) {
    return httpService.get(API_ENDPOINTS.RACKS.BY_ID(id));
  },

  async createRack(rackData) {
    // rackData: { warehouseId, name, kind, ... specific fields based on kind }
    return httpService.post(API_ENDPOINTS.RACKS.BASE, rackData);
  },

  async updateRack(id, rackData) {
    return httpService.put(API_ENDPOINTS.RACKS.BY_ID(id), rackData);
  },

  async deleteRack(id) {
    return httpService.delete(API_ENDPOINTS.RACKS.BY_ID(id));
  },

  // Создание полок/ячеек внутри стеллажа
  async createShelf(rackId, shelfData) {
    return httpService.post(`${API_ENDPOINTS.RACKS.BY_ID(rackId)}/shelves`, shelfData);
  },

  async createCell(rackId, cellData) {
    return httpService.post(`${API_ENDPOINTS.RACKS.BY_ID(rackId)}/cells`, cellData);
  },
};

export default warehouseService;

