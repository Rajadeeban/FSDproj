import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  overview: () => api.get('/dashboard/overview'),
};

export const renewableApi = {
  current: () => api.get('/renewable/current'),
  history: (hours = 24) => api.get(`/renewable/history?hours=${hours}`),
};

export const hydrogenApi = {
  current: () => api.get('/hydrogen/current'),
  history: (hours = 24) => api.get(`/hydrogen/history?hours=${hours}`),
  schedule: () => api.get('/hydrogen/schedule'),
};

export const storageApi = {
  current: () => api.get('/storage/current'),
  history: (hours = 24) => api.get(`/storage/history?hours=${hours}`),
};

export const optimizationApi = {
  run: () => api.post('/optimization/run'),
  history: (limit = 20) => api.get(`/optimization/history?limit=${limit}`),
};

export const simulationApi = {
  run: (payload) => api.post('/simulation/run', payload),
};

export const analyticsApi = {
  forecast: (hours = 24) => api.get(`/analytics/forecast?hours=${hours}`),
  analytics: (days = 7) => api.get(`/analytics/analytics?days=${days}`),
  exportUrl: (days = 7) => `${api.defaults.baseURL}/analytics/export?days=${days}`,
};

export const alertsApi = {
  list: (resolved) => api.get(`/alerts${resolved !== undefined ? `?resolved=${resolved}` : ''}`),
  refresh: () => api.post('/alerts/refresh'),
  resolve: (id) => api.patch(`/alerts/${id}/resolve`),
};

export const adminApi = {
  users: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  config: () => api.get('/admin/config'),
  upsertConfig: (payload) => api.post('/admin/config', payload),
  stats: () => api.get('/admin/stats'),
};
