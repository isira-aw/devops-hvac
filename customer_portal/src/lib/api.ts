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
    const token = localStorage.getItem('token');
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data),

  verify: (data: { email: string; code: string }) =>
    api.post('/api/auth/verify', data),

  googleLogin: (data: { googleId: string; email: string; name: string }) =>
    api.post('/api/auth/google', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/api/auth/forgot-password', data),

  resetPassword: (data: { token: string; username?: string; password?: string }) =>
    api.post('/api/auth/reset-password', data),
};

// Customer APIs
export const customerApi = {
  getProfile: () => api.get('/api/customer/profile'),

  getDevices: () => api.get('/api/customer/devices'),

  assignDevice: (data: { deviceId: string; accessPassword?: string }) =>
    api.post('/api/customer/devices/assign', data),

  unassignDevice: (deviceId: string) =>
    api.delete(`/api/customer/devices/${deviceId}/unassign`),

  updateDevice: (deviceId: string, data: { deviceName?: string; location?: string; accessPassword?: string }) =>
    api.put(`/api/customer/devices/${deviceId}`, data),

  getDeviceStatus: (deviceId: string) =>
    api.get(`/api/customer/devices/${deviceId}/status`),

  getTelemetry: (deviceId: string, limit = 100) =>
    api.get(`/api/customer/devices/${deviceId}/telemetry?limit=${limit}`),

  getTelemetryHistory: (deviceId: string, from?: string, to?: string) =>
    api.get(`/api/customer/devices/${deviceId}/telemetry/history`, { params: { from, to } }),

  sendControl: (deviceId: string, data: {
    systemOn?: boolean;
    mode?: string;
    fanSpeed?: string;
    temperatureSetpoint?: number;
  }) => api.post(`/api/customer/devices/${deviceId}/control`, data),

  getPredictions: (deviceId: string) =>
    api.get(`/api/customer/devices/${deviceId}/predictions`),

  getFaults: (deviceId: string, page = 0, size = 10) =>
    api.get(`/api/customer/devices/${deviceId}/faults?page=${page}&size=${size}`),

  getSchedules: (deviceId: string) =>
    api.get(`/api/customer/devices/${deviceId}/schedules`),

  createSchedule: (deviceId: string, data: {
    name: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string;
    systemOn: boolean;
    mode: string;
    temperatureSetpoint: number;
    fanSpeed: string;
  }) => api.post(`/api/customer/devices/${deviceId}/schedules`, data),

  deleteSchedule: (scheduleId: number) =>
    api.delete(`/api/customer/schedules/${scheduleId}`),

  changeCredentials: (data: { username?: string; password?: string }) =>
    api.post('/api/customer/change-credentials', data),
};

export default api;
