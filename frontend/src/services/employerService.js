import api from './api';

export const employerService = {
  // Profile
  getProfile: async () => {
    const response = await api.get('/employer/profile');
    return response.data;
  },

  saveProfile: async (data) => {
    const response = await api.post('/employer/profile', data);
    return response.data;
  },

  // Dashboard metrics
  getDashboardStats: async () => {
    const response = await api.get('/employer/dashboard/stats');
    return response.data;
  },

  // Job management
  getEmployerJobs: async (params = {}) => {
    const response = await api.get('/employer/jobs', { params });
    return response.data;
  },

  getEmployerJobById: async (id) => {
    const response = await api.get(`/employer/jobs/${id}`);
    return response.data;
  },

  createJob: async (data) => {
    const response = await api.post('/employer/jobs', data);
    return response.data;
  },

  updateJob: async (id, data) => {
    const response = await api.put(`/employer/jobs/${id}`, data);
    return response.data;
  },

  updateJobStatus: async (id, status) => {
    const response = await api.patch(`/employer/jobs/${id}/status`, { status });
    return response.data;
  },

  // Applicant management
  getJobApplicants: async (jobId, params = {}) => {
    const response = await api.get(`/employer/jobs/${jobId}/applications`, { params });
    return response.data;
  },

  getApplicantDetail: async (id) => {
    const response = await api.get(`/employer/applications/${id}`);
    return response.data;
  },

  updateApplicantStatus: async (id, data) => {
    const response = await api.put(`/employer/applications/${id}/status`, data);
    return response.data;
  },
};

export default employerService;
