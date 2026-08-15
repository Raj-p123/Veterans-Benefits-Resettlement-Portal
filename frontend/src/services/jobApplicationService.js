import api from './api';

export const jobApplicationService = {
  // Apply for a job
  applyForJob: async (jobId, data) => {
    const response = await api.post(`/jobs/${jobId}/apply`, data);
    return response.data;
  },

  // Get current veteran's job applications
  getMyApplications: async (params = {}) => {
    const response = await api.get('/jobs/applications/my', { params });
    return response.data;
  },

  // Get job application details
  getApplicationDetail: async (id) => {
    const response = await api.get(`/jobs/applications/${id}`);
    return response.data;
  },

  // Withdraw job application
  withdrawApplication: async (id) => {
    const response = await api.post(`/jobs/applications/${id}/withdraw`);
    return response.data;
  },
};

export default jobApplicationService;
