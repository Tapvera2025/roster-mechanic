import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Site API endpoints
export const siteApi = {
  getAll: (params) => api.get('/sites', { params }),
  getById: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  bulkCreate: (sites) => api.post('/sites/bulk', { sites }),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
  getEmployees: (id) => api.get(`/sites/${id}/employees`),
  assignEmployees: (id, employeeIds) => api.post(`/sites/${id}/employees`, { employeeIds }),
  getAccessCodes: (id) => api.get(`/sites/${id}/access-codes`),
  addAccessCode: (id, data) => api.post(`/sites/${id}/access-codes`, data),
  updateAccessCode: (id, codeId, data) => api.put(`/sites/${id}/access-codes/${codeId}`, data),
  deleteAccessCode: (id, codeId) => api.delete(`/sites/${id}/access-codes/${codeId}`)
};

// Scheduler API endpoints
export const schedulerApi = {
  getSites: () => api.get('/scheduler/sites'),
  getSiteEmployees: (siteId) => api.get(`/scheduler/sites/${siteId}/employees`),
  getSiteShifts: (siteId, startDate, endDate) =>
    api.get(`/scheduler/sites/${siteId}/shifts`, { params: { startDate, endDate } })
};

// Shift API endpoints
export const shiftApi = {
  getById: (id) => api.get(`/scheduler/shifts/${id}`),
  create: (data) => api.post('/scheduler/shifts', data),
  update: (id, data) => api.put(`/scheduler/shifts/${id}`, data),
  delete: (id) => api.delete(`/scheduler/shifts/${id}`)
};

// Weather API endpoints
export const weatherApi = {
  getForecast: (latitude, longitude) =>
    api.get('/weather/forecast', { params: { latitude, longitude } })
};

// Employee API endpoints
export const employeeApi = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  assignToSites: (id, siteIds) => api.post(`/employees/${id}/sites`, { siteIds })
};

// User/Auth API endpoints
export const userApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMyShifts: (startDate, endDate) =>
    api.get('/user/shifts', { params: { startDate, endDate } }),
  changePassword: (data) => api.post('/user/change-password', data),
  getProfile: () => api.get('/user/profile')
};

export default api;
