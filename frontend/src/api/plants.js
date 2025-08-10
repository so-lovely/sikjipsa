import apiClient from './client';

export const plantAPI = {
  // 모든 식물 조회 (백과사전 데이터)
  getAllPlants: async () => {
    const response = await apiClient.get('/plants');
    return response.data.plants || []; // plants 배열만 반환
  },

  // 특정 식물 상세 조회
  getPlant: async (plantId) => {
    const response = await apiClient.get(`/plants/${plantId}`);
    return response.data;
  },

  // 카테고리별 식물 조회
  getPlantsByCategory: async (categoryId) => {
    const response = await apiClient.get(`/plants?category=${categoryId}`);
    return response.data;
  },

  // 식물 검색
  searchPlants: async (query) => {
    const response = await apiClient.get(`/plants/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // 식물 카테고리 조회
  getCategories: async () => {
    const response = await apiClient.get('/plants/categories');
    return response.data;
  }
};