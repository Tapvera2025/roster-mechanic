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
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
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
  createAdhoc: (data) => api.post('/scheduler/shifts/adhoc', data),
  update: (id, data) => api.put(`/scheduler/shifts/${id}`, data),
  delete: (id) => api.delete(`/scheduler/shifts/${id}`),
  getMyShifts: (startDate, endDate) => api.get('/shifts/my-shifts', { params: { startDate, endDate } }),
  getMyEmployee: () => api.get('/shifts/my-employee'),
  getDeleted: (siteId) => api.get('/scheduler/shifts/deleted', { params: { siteId } }),
  restore: (id) => api.put(`/scheduler/shifts/${id}/restore`),
  permanentDelete: (id) => api.delete(`/scheduler/shifts/${id}/permanent`)
};

// Weather API endpoints
export const weatherApi = {
  getForecast: (latitude, longitude) =>
    api.get('/weather/forecast', { params: { latitude, longitude } })
};

// Client API endpoints
export const clientApi = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  bulkCreate: (clients) => api.post('/clients/bulk', { clients }),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`)
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
    api.get('/shifts/my-shifts', { params: { startDate, endDate } }),
  changePassword: (data) => api.put('/users/me/password', data),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data)
};

// Clock In/Out API endpoints
export const clockApi = {
  clockIn: (employeeId, siteId, latitude, longitude, photo, shiftId) => {
    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('siteId', siteId);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (photo) formData.append('photo', photo);
    if (shiftId) formData.append('shiftId', shiftId);

    return api.post('/clock/in', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  clockOut: (employeeId, latitude, longitude, photo) => {
    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (photo) formData.append('photo', photo);

    return api.post('/clock/out', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getCurrentStatus: (employeeId) => api.get('/clock/status', { params: { employeeId } }),

  getMyHistory: (employeeId, params = {}) => api.get('/clock/history', {
    params: { employeeId, ...params }
  }),

  getRecords: (params = {}) => api.get('/clock/records', { params }),

  exportCSV: (params = {}) => api.get('/clock/export', {
    params,
    responseType: 'blob'
  }),

  // Approval workflow
  approveTimeRecord: (timeRecordId) => api.put(`/clock/approve/${timeRecordId}`),
  rejectTimeRecord: (timeRecordId, reason) => api.put(`/clock/reject/${timeRecordId}`, { reason }),
  bulkApproveTimeRecords: (timeRecordIds) => api.post('/clock/approve/bulk', { timeRecordIds }),
  bulkRejectTimeRecords: (timeRecordIds, reason) => api.post('/clock/reject/bulk', { timeRecordIds, reason }),

  // Break management
  startBreak: (employeeId, breakType, notes) => api.post('/clock/break/start', { employeeId, breakType, notes }),
  endBreak: (employeeId) => api.post('/clock/break/end', { employeeId }),
};

// Leave API endpoints
export const leaveApi = {
  // Admin
  getAll: (params) => api.get('/leave', { params }),
  getStats: () => api.get('/leave/stats'),
  create: (data) => api.post('/leave', data),
  approve: (id, actionNote = '') => api.put(`/leave/${id}/approve`, { actionNote }),
  decline: (id, actionNote = '') => api.put(`/leave/${id}/decline`, { actionNote }),
  cancel: (id) => api.put(`/leave/${id}/cancel`),
  // Employee self-service
  getMy: (params) => api.get('/leave/my', { params }),
  submitMy: (data) => api.post('/leave/my', data),
  cancelMy: (id) => api.put(`/leave/my/${id}/cancel`),
};

// Dashboard API endpoints
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAttendance: () => api.get('/dashboard/attendance'),
};

// Geocoding API endpoints
export const geocodingApi = {
  search: (query, countryCode = 'au', limit = 5) =>
    api.get('/geocoding/search', { params: { q: query, countryCode, limit } }),
  reverse: (lat, lon) =>
    api.get('/geocoding/reverse', { params: { lat, lon } }),
};

export default api;
