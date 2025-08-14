import apiClient from './client';

export const diaryAPI = {
  // 사용자의 모든 다이어리 조회
  getUserDiaries: async () => {
    const response = await apiClient.get('/diary');
    return response.data;
  },

  // 특정 다이어리 상세 조회
  getDiary: async (diaryId) => {
    const response = await apiClient.get(`/diary/${diaryId}`);
    return response.data;
  },

  // 새 다이어리 생성
  createDiary: async (diaryData) => {
    const response = await apiClient.post('/diary', diaryData);
    return response.data;
  },

  // 다이어리 엔트리 추가 (multipart/form-data로 전송)
  addEntry: async (diaryId, entryData, imageFiles = []) => {
    const formData = new FormData();
    
    // 텍스트 필드 추가
    formData.append('title', entryData.title || '');
    formData.append('content', entryData.content);
    formData.append('growth_stage', entryData.growth_stage || 'growing');
    formData.append('entry_date', entryData.entry_date);
    
    // 이미지 파일들 추가
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await apiClient.post(`/diary/${diaryId}/entries`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 다이어리 엔트리 수정 (multipart/form-data로 전송)
  updateEntry: async (diaryId, entryId, entryData, imageFiles = [], existingImages = []) => {
    const formData = new FormData();
    
    // 텍스트 필드 추가
    formData.append('title', entryData.title || '');
    formData.append('content', entryData.content);
    formData.append('growth_stage', entryData.growth_stage || 'growing');
    formData.append('entry_date', entryData.entry_date);
    
    // 기존 이미지 정보 추가
    if (existingImages.length > 0) {
      formData.append('existing_images', JSON.stringify(existingImages));
    }
    
    // 새로운 이미지 파일들 추가
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await apiClient.put(`/diary/${diaryId}/entries/${entryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 다이어리 엔트리 삭제
  deleteEntry: async (diaryId, entryId) => {
    const response = await apiClient.delete(`/diary/${diaryId}/entries/${entryId}`);
    return response.data;
  },

  // 이미지 파일을 base64로 변환 (미리보기용)
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  },

  // 이미지 파일 검증
  validateImageFile: (file) => {
    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.');
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('이미지 파일은 최대 5MB까지 업로드 가능합니다.');
    }

    return true;
  },

  

  // 활동 타입별 아이콘 매핑
  getActivityIcon: (activityType) => {
    const iconMap = {
      watering: '💧',
      fertilizing: '🌱', 
      pruning: '✂️',
      repotting: '🪴',
      observation: '👀',
      treatment: '💊',
      default: '📝'
    };
    
    return iconMap[activityType] || iconMap.default;
  },

  // 성장 단계별 색상 매핑
  getGrowthStageColor: (stage) => {
    const colorMap = {
      seedling: '#10B981',
      growing: '#3B82F6', 
      flowering: '#F59E0B',
      mature: '#6366F1',
      dormant: '#6B7280',
      default: '#22C55E'
    };
    
    return colorMap[stage] || colorMap.default;
  }
};