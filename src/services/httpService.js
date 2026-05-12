

import api, { clearAuthData } from '../store/api';
import { API_ENDPOINTS } from '../config/api';

const buildConfig = (options = {}) => {
    const { includeAuth = true, headers = {}, ...rest } = options;
    const cfg = { ...rest, headers: { ...headers } };
    if (!includeAuth) cfg.headers._skipAuth = true;
    return cfg;
};

const httpService = {
    async get(url, options = {}) {
        const response = await api.get(url, buildConfig(options));
        return response.data;
    },

    async post(url, data, options = {}) {
        const response = await api.post(url, data, buildConfig(options));
        return response.data;
    },

    async put(url, data, options = {}) {
        const response = await api.put(url, data, buildConfig(options));
        return response.data;
    },

    async patch(url, data, options = {}) {
        const response = await api.patch(url, data, buildConfig(options));
        return response.data;
    },

    async delete(url, options = {}) {
        await api.delete(url, buildConfig(options));
        return true;
    },

    async postFormData(url, formData, options = {}) {
        const cfg = buildConfig(options);
        const response = await api.post(url, formData, {
            ...cfg,
            headers: { ...cfg.headers, 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async downloadFile(url, filename) {
        const response = await api.get(url, { responseType: 'blob' });
        const blobUrl = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    },

    setTokens(accessToken, refreshToken) {
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
        } else {
            localStorage.removeItem('accessToken');
        }
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        } else {
            localStorage.removeItem('refreshToken');
        }
    },

    clearTokens() {
        clearAuthData();
    },

    async refreshAccessToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) return false;
            const response = await api.post(
                API_ENDPOINTS.AUTH.REFRESH,
                { refreshToken },
                { headers: { _skipAuth: true } }
            );
            const { accessToken, refreshToken: newRefreshToken } = response.data || {};
            if (accessToken) {
                this.setTokens(accessToken, newRefreshToken || refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            return false;
        }
    },
};

export default httpService;
