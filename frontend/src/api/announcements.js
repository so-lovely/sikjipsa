import apiClient from './client';

export const announcementAPI = {
  // Get all announcements
  getAnnouncements: async () => {
    const response = await apiClient.get('/announcements');
    return response.data;
  },

  // Get specific announcement by ID
  getAnnouncement: async (id) => {
    const response = await apiClient.get(`/announcements/${id}`);
    return response.data;
  },

  // Create new announcement (Admin only)
  createAnnouncement: async (announcementData) => {
    const response = await apiClient.post('/announcements', announcementData);
    return response.data;
  },

  // Update announcement (Admin only)
  updateAnnouncement: async (id, announcementData) => {
    const response = await apiClient.put(`/announcements/${id}`, announcementData);
    return response.data;
  },

  // Delete announcement (Admin only)
  deleteAnnouncement: async (id) => {
    const response = await apiClient.delete(`/announcements/${id}`);
    return response.data;
  }
};