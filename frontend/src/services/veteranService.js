import apiClient from './api.js';

export const veteranService = {
  getProfile: async () => {
    const res = await apiClient.get('/veteran/profile');
    return res.data;
  },

  createProfile: async (profileData) => {
    const res = await apiClient.post('/veteran/profile', profileData);
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await apiClient.put('/veteran/profile', profileData);
    return res.data;
  },

  getCompletion: async () => {
    const res = await apiClient.get('/veteran/profile/completion');
    return res.data;
  },
};

export default veteranService;
