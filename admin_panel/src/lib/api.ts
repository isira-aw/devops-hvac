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
        window.location.href = '/login';
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

// Admin APIs
export const adminApi = {
  getDashboard: () => api.get('/api/admin/dashboard'),

  // Devices
  getDevices: (page = 0, size = 10) =>
    api.get(`/api/admin/devices?page=${page}&size=${size}`),

  getDevice: (deviceId: string) =>
    api.get(`/api/admin/devices/${deviceId}`),

  registerDevice: (data: {
    deviceId: string;
    deviceName: string;
    location: string;
    accessPassword?: string;
    isLicensed: boolean;
    requireEmailVerification: boolean;
    allowedEmails?: string[];
    allowedEmailDomain?: string;
  }) => api.post('/api/admin/devices', data),

  updateDevice: (deviceId: string, data: any) =>
    api.put(`/api/admin/devices/${deviceId}`, data),

  deleteDevice: (deviceId: string) =>
    api.delete(`/api/admin/devices/${deviceId}`),

  updateLicense: (deviceId: string, isLicensed: boolean) =>
    api.patch(`/api/admin/devices/${deviceId}/license`, { isLicensed }),

  // Admins
  getAdmins: (page = 0, size = 10) =>
    api.get(`/api/admin/admins?page=${page}&size=${size}`),

  createAdmin: (data: { username: string; email: string; password: string }) =>
    api.post('/api/admin/admins', data),

  deleteAdmin: (adminId: number) =>
    api.delete(`/api/admin/admins/${adminId}`),

  // Users
  getUsers: (page = 0, size = 10) =>
    api.get(`/api/admin/users?page=${page}&size=${size}`),

  // Faults
  getFaults: (page = 0, size = 10) =>
    api.get(`/api/admin/faults?page=${page}&size=${size}`),

  getUnresolvedFaults: (page = 0, size = 10) =>
    api.get(`/api/admin/faults/unresolved?page=${page}&size=${size}`),
};

export default api;
