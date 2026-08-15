import apiClient from './api.js';

export const schemeService = {
  getSchemes: async (params = {}) => {
    const res = await apiClient.get('/schemes', { params });
    return res?.data || res;
  },

  searchSchemes: async (params = {}) => {
    const res = await apiClient.get('/schemes/search', { params });
    return res?.data || res;
  },

  getFeaturedSchemes: async () => {
    const res = await apiClient.get('/schemes/featured');
    return res?.data || res;
  },

  getSchemeById: async (id) => {
    const res = await apiClient.get(`/schemes/${id}`);
    return res?.data || res;
  },

  checkEligibility: async (schemeId) => {
    const res = await apiClient.post('/schemes/check-eligibility', { schemeId });
    return res?.data || res;
  },

  getRecommendedSchemes: async () => {
    const res = await apiClient.get('/schemes/recommended');
    return res?.data || res;
  },
};

export default schemeService;
