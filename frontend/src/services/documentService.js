import apiClient from './api.js';
import { authStorage } from '../utils/authStorage.js';

export const documentService = {
  uploadDocument: async (formData, onUploadProgress) => {
    const res = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  replaceDocument: async (id, formData, onUploadProgress) => {
    const res = await apiClient.put(`/documents/${id}/replace`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  getDocuments: async () => {
    const res = await apiClient.get('/documents');
    return res.data;
  },

  getDocumentById: async (id) => {
    const res = await apiClient.get(`/documents/${id}`);
    return res.data;
  },

  deleteDocument: async (id) => {
    const res = await apiClient.delete(`/documents/${id}`);
    return res.data;
  },

  /**
   * Helper to construct authenticated direct view / download link
   */
  getDocumentViewUrl: (docId, fileUrl) => {
    const token = authStorage.getToken();
    const backendBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

    if (docId) {
      return `${backendBase}/documents/${docId}/file?token=${encodeURIComponent(token || '')}`;
    }

    if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
      return fileUrl;
    }

    const cleanUrl = fileUrl?.startsWith('/') ? fileUrl : `/${fileUrl || ''}`;
    const baseUrl = backendBase.replace(/\/api\/?$/, '');
    return `${baseUrl}${cleanUrl}?token=${encodeURIComponent(token || '')}`;
  },
};

export default documentService;
