import api from './api.js';

export const jobService = {
  // Public job catalog with optional location & radius filters
  getJobs: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    return response?.data || response;
  },

  // Nearby jobs discovery
  getNearbyJobs: async (params = {}) => {
    const response = await api.get('/jobs/nearby', { params });
    return response?.data || response;
  },

  // Featured active jobs
  getFeaturedJobs: async () => {
    const response = await api.get('/jobs/featured');
    return response?.data || response;
  },

  // Personalized recommendations for veteran
  getRecommendedJobs: async () => {
    const response = await api.get('/jobs/recommended');
    return response?.data || response;
  },

  // Single job detail
  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response?.data || response;
  },

  // Bookmark/Save job
  saveJob: async (id) => {
    const response = await api.post(`/jobs/${id}/save`);
    return response?.data || response;
  },

  // Remove saved job
  unsaveJob: async (id) => {
    const response = await api.delete(`/jobs/${id}/save`);
    return response?.data || response;
  },

  // Get all saved jobs
  getSavedJobs: async () => {
    const response = await api.get('/jobs/saved');
    return response?.data || response;
  },
};

export default jobService;
