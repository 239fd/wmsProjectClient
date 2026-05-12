
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const profileService = {
  async getProfile() {
    return httpService.get(API_ENDPOINTS.PROFILE.GET);
  },

  async updateProfile(profileData) {
    const response = await httpService.put(API_ENDPOINTS.PROFILE.UPDATE, profileData);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...user, ...profileData }));
    return response;
  },

  async changePassword(payload) {

    return httpService.put(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, payload);
  },

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    return httpService.postFormData(API_ENDPOINTS.PROFILE.PHOTO, formData);
  },

  async deletePhoto() {
    return httpService.delete(API_ENDPOINTS.PROFILE.PHOTO);
  },

  async getSessions() {
    return httpService.get(API_ENDPOINTS.PROFILE.SESSIONS);
  },

  async terminateSession(sessionId) {
    return httpService.delete(API_ENDPOINTS.PROFILE.SESSION_BY_ID(sessionId));
  },

  async terminateAllSessions() {
    return httpService.delete(API_ENDPOINTS.PROFILE.SESSIONS);
  },

  async deleteAccount() {

    return httpService.delete(API_ENDPOINTS.PROFILE.DELETE_ACCOUNT);
  },
};

export default profileService;
