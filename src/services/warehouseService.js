
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const warehouseService = {

  async getWarehouses() {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.BASE);
  },

  async getWarehousesByOrg(orgId) {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.BY_ORG(orgId));
  },

  async getWarehouse(id) {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.BY_ID(id));
  },

  async createWarehouse(payload) {

    return httpService.post(API_ENDPOINTS.WAREHOUSES.BASE, payload);
  },

  async updateWarehouse(id, payload) {
    return httpService.put(API_ENDPOINTS.WAREHOUSES.BY_ID(id), payload);
  },

  async deleteWarehouse(id) {
    return httpService.delete(API_ENDPOINTS.WAREHOUSES.BY_ID(id));
  },

  async getWarehouseAnalytics() {
    return httpService.get(API_ENDPOINTS.WAREHOUSES.ANALYTICS);
  },

  async getRacksByWarehouse(warehouseId) {
    return httpService.get(API_ENDPOINTS.RACKS.BY_WAREHOUSE(warehouseId));
  },

  async getRack(id) {
    return httpService.get(API_ENDPOINTS.RACKS.BY_ID(id));
  },

  async createRack(payload) {

    return httpService.post(API_ENDPOINTS.RACKS.BASE, payload);
  },

  async deleteRack(id) {
    return httpService.delete(API_ENDPOINTS.RACKS.BY_ID(id));
  },

  async addShelf(rackId, payload) {

    return httpService.post(API_ENDPOINTS.RACKS.SHELVES(rackId), { rackId, ...payload });
  },

  async addCell(rackId, payload) {

    return httpService.post(API_ENDPOINTS.RACKS.CELLS(rackId), { rackId, ...payload });
  },

  async addPallet(rackId, payload) {

    return httpService.post(API_ENDPOINTS.RACKS.PALLETS(rackId), { rackId, ...payload });
  },

  async getCell(cellId) {
    return httpService.get(API_ENDPOINTS.RACKS.CELL_BY_ID(cellId));
  },

  async getCellByCode(slotCode, warehouseId) {
    return httpService.get(API_ENDPOINTS.RACKS.CELL_BY_CODE(slotCode, warehouseId));
  },

  async renameSlotCode(slotId, slotCode) {
    return httpService.patch(API_ENDPOINTS.RACKS.SLOT_CODE(slotId), { slotCode });
  },

  async getSlotsByRack(rackId) {
    return httpService.get(API_ENDPOINTS.RACKS.SLOTS(rackId));
  },

  async getAllCellsFlat(warehouseId) {
    return httpService.get(API_ENDPOINTS.RACKS.CELLS_FLAT(warehouseId));
  },
};

export default warehouseService;
