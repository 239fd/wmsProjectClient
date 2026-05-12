
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const organizationService = {

  async getById(orgId) {
    return httpService.get(API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId));
  },

  async create(orgData) {

    return httpService.post(API_ENDPOINTS.ORGANIZATIONS.BASE, orgData);
  },

  async update(orgId, orgData) {
    return httpService.put(API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId), orgData);
  },

  async delete(orgId) {
    return httpService.delete(API_ENDPOINTS.ORGANIZATIONS.BY_ID(orgId));
  },

  async getEmployees(orgId, { page = 0, size = 50 } = {}) {
    return httpService.get(`${API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId)}?page=${page}&size=${size}`);
  },

  async deleteEmployee(orgId, userId) {
    return httpService.delete(API_ENDPOINTS.ORGANIZATIONS.EMPLOYEE_BY_ID(orgId, userId));
  },

  async setEmployeeBlocked(orgId, userId, blocked) {
    return httpService.patch(API_ENDPOINTS.ORGANIZATIONS.EMPLOYEE_STATUS(orgId, userId), { blocked });
  },

  async createInvitation(orgId, payload) {

    return httpService.post(API_ENDPOINTS.ORGANIZATIONS.INVITATIONS(orgId), payload);
  },

  async listInvitations(orgId) {
    return httpService.get(API_ENDPOINTS.ORGANIZATIONS.INVITATIONS(orgId));
  },
};

export default organizationService;
