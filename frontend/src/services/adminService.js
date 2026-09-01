import apiClient from './api.js';

export const adminService = {
  // Dashboard & Statistics
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),

  // Veteran Management & Verification
  getVeterans: (params) => apiClient.get('/admin/veterans', { params }),
  getVeteranById: (id) => apiClient.get(`/admin/veterans/${id}`),
  updateVeteranVerification: (id, data) => apiClient.put(`/admin/veterans/${id}/verification`, data),

  // Document Verification
  getDocuments: (params) => apiClient.get('/admin/documents', { params }),
  updateDocumentStatus: (id, data) => apiClient.put(`/admin/documents/${id}/status`, data),

  // Employer Management & Verification
  getEmployers: (params) => apiClient.get('/admin/employers', { params }),
  getEmployerById: (id) => apiClient.get(`/admin/employers/${id}`),
  updateEmployerVerification: (id, data) => apiClient.put(`/admin/employers/${id}/verification`, data),

  // User Account Management
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),
  updateUserStatus: (id, data) => apiClient.put(`/admin/users/${id}/status`, data),

  // Welfare Scheme Management
  getSchemes: (params) => apiClient.get('/admin/schemes', { params }),
  getSchemeById: (id) => apiClient.get(`/admin/schemes/${id}`),
  createScheme: (data) => apiClient.post('/admin/schemes', data),
  updateScheme: (id, data) => apiClient.put(`/admin/schemes/${id}`, data),
  deleteScheme: (id) => apiClient.delete(`/admin/schemes/${id}`),

  // Job Moderation & Management
  getJobs: (params) => apiClient.get('/admin/jobs', { params }),
  getJobById: (id) => apiClient.get(`/admin/jobs/${id}`),
  updateJobStatus: (id, data) => apiClient.put(`/admin/jobs/${id}/status`, data),
  deleteJob: (id) => apiClient.delete(`/admin/jobs/${id}`),

  // Scheme Application Management
  getSchemeApplications: (params) => apiClient.get('/admin/applications/schemes', { params }),
  getSchemeApplicationById: (id) => apiClient.get(`/admin/applications/schemes/${id}`),
  updateSchemeApplicationStatus: (id, data) => apiClient.put(`/admin/applications/schemes/${id}/status`, data),

  // Job Application Monitoring
  getJobApplications: (params) => apiClient.get('/admin/applications/jobs', { params }),
  getJobApplicationById: (id) => apiClient.get(`/admin/applications/jobs/${id}`),

  // Analytics & Aggregated Metrics
  getAnalytics: (params) => apiClient.get('/admin/analytics', { params }),

  // Reports & CSV Exports
  getReportsSummary: () => apiClient.get('/admin/reports/summary'),
  downloadReportCsv: async (reportType, queryParams = {}) => {
    const res = await apiClient.get(`/admin/reports/${reportType}/export`, {
      params: queryParams,
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
  getExportUrl: (reportType, queryParams = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
    const params = new URLSearchParams(queryParams).toString();
    return `${baseUrl}/admin/reports/${reportType}/export${params ? `?${params}` : ''}`;
  },

  // Audit Logs
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),

  // Global Search
  globalSearch: (q) => apiClient.get('/admin/search', { params: { q } }),

  // Settings & Password Management
  getProfile: () => apiClient.get('/admin/settings/profile'),
  updateProfile: (data) => apiClient.put('/admin/settings/profile', data),
  changePassword: (data) => apiClient.put('/admin/settings/change-password', data),
};

export default adminService;
