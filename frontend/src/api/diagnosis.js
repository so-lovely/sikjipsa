import apiClient from './client';

export const diagnosisAPI = {
  // 식물 분석 요청
  analyzePlant: async (imageFile, location = null) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // 위치 정보가 있으면 추가
    if (location && location.latitude && location.longitude) {
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
    }

    const response = await apiClient.post('/diagnosis/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // 진단이 시작된 후 결과를 폴링하여 완성된 결과 반환
    if (response.data.diagnosis_id) {
      const result = await diagnosisAPI.pollDiagnosisResult(response.data.diagnosis_id);
      
      // 프론트엔드가 기대하는 형태로 데이터 변환
      return {
        plantName: result.plant_name || '식물',
        confidence: Math.round(result.confidence ?? 50),
        healthStatus: result.is_healthy ? 'healthy' : 'warning',
        issues: result.diseases?.map(disease => `${disease.disease_name} (${Math.round(disease.confidence)}% 확률)`) || [],
        recommendations: result.suggestions?.map(suggestion => suggestion.message) || [],
        imageUrl: result.image_url
      };
    }
    
    return response.data;
  },






  // 진단 결과 폴링 (결과가 완료될 때까지 주기적으로 확인)
  pollDiagnosisResult: async (diagnosisId, maxAttempts = 30, interval = 2000) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          attempts++;
          const result = await diagnosisAPI.getDiagnosisResult(diagnosisId);
          
          if (result.status === 'completed') {
            resolve(result);
          } else if (result.status === 'failed') {
            reject(new Error(result.error_message || 'Analysis failed'));
          } else if (attempts >= maxAttempts) {
            reject(new Error('Analysis timeout - please try again'));
          } else {
            // 아직 processing 상태면 다시 시도
            setTimeout(poll, interval);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(poll, interval);
          }
        }
      };
      
      poll();
    });
  },

  // 이미지 파일 검증
  validateImageFile: (file) => {
    // 파일 타입 검증
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.');
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('이미지 파일은 최대 10MB까지 업로드 가능합니다.');
    }

    return true;
  },

  // 이미지 파일을 base64로 변환 (미리보기용)
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
};