import apiClient from './client';

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // 소셜 로그인
  socialLogin: async (provider, authData) => {
    const response = await apiClient.post(`/auth/${provider}`, authData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // 소셜 계정 연동
  linkSocialAccount: async (provider, authData) => {
    const response = await apiClient.post(`/auth/link/${provider}`, authData);
    return response.data;
  },

  // 소셜 계정 연동 해제
  unlinkSocialAccount: async (provider) => {
    const response = await apiClient.delete(`/auth/unlink/${provider}`);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // 프로필 업데이트
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
};