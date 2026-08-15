import apiClient from './api.js';

export const applicationService = {
  createApplication: async (schemeId) => {
    const res = await apiClient.post('/applications', { schemeId });
    return res.data;
  },

  getMyApplications: async (params = {}) => {
    const res = await apiClient.get('/applications/my', { params });
    return res.data;
  },

  getApplicationStats: async () => {
    const res = await apiClient.get('/applications/stats');
    return res.data;
  },

  getApplicationById: async (id) => {
    const res = await apiClient.get(`/applications/${id}`);
    return res.data;
  },

  updateApplication: async (id, data) => {
    const res = await apiClient.put(`/applications/${id}`, data);
    return res.data;
  },

  submitApplication: async (id, data) => {
    const res = await apiClient.post(`/applications/${id}/submit`, data);
    return res.data;
  },

  withdrawApplication: async (id) => {
    const res = await apiClient.post(`/applications/${id}/withdraw`);
    return res.data;
  },

  updateApplicationStatus: async (id, data) => {
    const res = await apiClient.put(`/applications/${id}/status`, data);
    return res.data;
  },
};

export default applicationService;
