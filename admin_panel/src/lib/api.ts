import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data),

  verify: (data: { email: string; code: string }) =>
    api.post('/api/auth/verify', data),
};

// Knowledge Base APIs
export const knowledgeBaseApi = {
  getAll: (page = 0, size = 20) =>
    api.get(`/api/admin/knowledge-base?page=${page}&size=${size}`),

  get: (id: number) =>
    api.get(`/api/admin/knowledge-base/${id}`),

  create: (data: { title: string; category: string; content: string; isActive: boolean }) =>
    api.post('/api/admin/knowledge-base', data),

  update: (id: number, data: { title: string; category: string; content: string; isActive: boolean }) =>
    api.put(`/api/admin/knowledge-base/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/admin/knowledge-base/${id}`),
};

export default api;
