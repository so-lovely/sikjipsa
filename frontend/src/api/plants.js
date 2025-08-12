import apiClient from './client';

export const plantAPI = {
  // 모든 식물 조회 (백과사전 데이터)
  getAllPlants: async () => {
    const response = await apiClient.get('/plants');
    return response.data.plants || []; // plants 배열만 반환
  },



  // 식물 카테고리 조회
  getCategories: async () => {
    const response = await apiClient.get('/plants/categories');
    return response.data;
  }
};