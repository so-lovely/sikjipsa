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
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },


  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },


  // 프로필 업데이트
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // 회원탈퇴
  deleteAccount: async () => {
    const response = await apiClient.delete('/auth/account');
    // 탈퇴 성공시 로컬 저장소 정리
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  },
};