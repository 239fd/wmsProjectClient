// Profile Service - сервис работы с профилем
import httpService from './httpService';
import { API_ENDPOINTS } from '../config/api';

const profileService = {
  async getProfile() {
    return httpService.get(API_ENDPOINTS.PROFILE.GET);
  },

  async updateProfile(profileData) {
    // profileData: { fullName, email }
    const response = await httpService.put(API_ENDPOINTS.PROFILE.UPDATE, profileData);

    // Обновляем локальные данные пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return response;
  },

  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    return httpService.postFormData(API_ENDPOINTS.PROFILE.UPLOAD_PHOTO, formData);
  },

  async getSessions() {
    return httpService.get(API_ENDPOINTS.PROFILE.SESSIONS);
  },

  async terminateSession(sessionId) {
    return httpService.delete(`${API_ENDPOINTS.PROFILE.SESSIONS}/${sessionId}`);
  },
};

export default profileService;

