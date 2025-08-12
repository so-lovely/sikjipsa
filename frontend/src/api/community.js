import apiClient from './client';

export const communityAPI = {
  // 게시글 목록 조회
  getPosts: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.category && params.category !== 'all') {
      queryParams.append('type', params.category);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }
    
    const response = await apiClient.get(`/community/posts?${queryParams.toString()}`);
    return response.data;
  },

  // 특정 게시글 조회
  getPost: async (postId) => {
    const response = await apiClient.get(`/community/posts/${postId}`);
    return response.data;
  },

  // 새 게시글 작성
  createPost: async (postData, images = []) => {
    const formData = new FormData();
    
    // 텍스트 데이터 추가
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('post_type', postData.post_type || postData.category);
    
    // 이미지 파일들 추가
    images.forEach((image, index) => {
      if (image.file) {
        formData.append('images', image.file);
      }
    });

    console.log('Sending FormData to API:', {
      title: postData.title,
      content: postData.content,
      post_type: postData.category,
      imageCount: images.length
    });

    const response = await apiClient.post('/community/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // 게시글 수정
  updatePost: async (postId, postData, newImages = [], existingImages = []) => {
    const formData = new FormData();
    
    // 텍스트 데이터 추가
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('post_type', postData.post_type || postData.category);
    
    // 유지할 기존 이미지 URL들
    if (existingImages.length > 0) {
      formData.append('existing_images', JSON.stringify(existingImages));
    }
    
    // 새로운 이미지 파일들 추가
    newImages.forEach((image) => {
      if (image.file) {
        formData.append('images', image.file);
      }
    });

    console.log('Updating post:', {
      title: postData.title,
      content: postData.content,
      post_type: postData.category,
      existingImageCount: existingImages.length,
      newImageCount: newImages.length
    });

    const response = await apiClient.put(`/community/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // 게시글 삭제
  deletePost: async (postId) => {
    const response = await apiClient.delete(`/community/posts/${postId}`);
    return response.data;
  },

  // 게시글 좋아요/좋아요 취소
  toggleLike: async (postId) => {
    const response = await apiClient.post(`/community/posts/${postId}/like`);
    return response.data;
  },


  // 댓글 작성
  createComment: async (postId, content, parentId = null) => {
    const requestData = { content };
    if (parentId) {
      requestData.parent_id = parentId;
    }
    
    const response = await apiClient.post(`/community/posts/${postId}/comments`, requestData);
    return response.data;
  },

  // 댓글 수정
  updateComment: async (postId, commentId, content) => {
    const response = await apiClient.put(`/community/posts/${postId}/comments/${commentId}`, {
      content: content
    });
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (postId, commentId) => {
    const response = await apiClient.delete(`/community/posts/${postId}/comments/${commentId}`);
    return response.data;
  },



  
};