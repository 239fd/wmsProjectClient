// Organization Service - сервис работы с организациями
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const organizationService = {
  async getMyOrganization() {
    return httpService.get(API_ENDPOINTS.ORGANIZATIONS.MY);
  },

  async createOrganization(orgData) {
    // orgData: { name, inn, address, directorName }
    return httpService.post(API_ENDPOINTS.ORGANIZATIONS.BASE, orgData);
  },

  async updateOrganization(orgId, orgData) {
    return httpService.put(`${API_ENDPOINTS.ORGANIZATIONS.BASE}/${orgId}`, orgData);
  },

  async joinOrganization(invitationCode) {
    return httpService.post(API_ENDPOINTS.ORGANIZATIONS.JOIN, { invitationCode });
  },

  async getEmployees(orgId) {
    return httpService.get(API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId));
  },

  async addEmployee(orgId, employeeData) {
    return httpService.post(API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId), employeeData);
  },

  async removeEmployee(orgId, employeeId) {
    return httpService.delete(`${API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId)}/${employeeId}`);
  },

  async updateEmployeeRole(orgId, employeeId, role) {
    return httpService.put(
      `${API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId)}/${employeeId}/role`,
      { role }
    );
  },

  async getInvitationCode(orgId) {
    return httpService.get(API_ENDPOINTS.ORGANIZATIONS.INVITATION_CODE(orgId));
  },

  async regenerateInvitationCode(orgId) {
    return httpService.post(API_ENDPOINTS.ORGANIZATIONS.INVITATION_CODE(orgId), {});
  },
};

export default organizationService;

