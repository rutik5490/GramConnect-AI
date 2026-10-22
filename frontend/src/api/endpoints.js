import client from './client'

export const authApi = {
  login: (email, password) => client.post('/api/auth/login', { email, password }),
  me: () => client.get('/api/auth/me'),
  forgotPassword: (email) => client.post('/api/auth/forgot-password', { email }),
}

export const panchayatApi = {
  list: () => client.get('/api/panchayats'),
}

export const wardApi = {
  list: (panchayatId) => client.get('/api/wards', { params: { panchayat_id: panchayatId } }),
  create: (payload) => client.post('/api/wards', payload),
  update: (id, payload) => client.patch(`/api/wards/${id}`, payload),
  remove: (id) => client.delete(`/api/wards/${id}`),
  stats: (panchayatId) => client.get('/api/wards/stats', { params: { panchayat_id: panchayatId } }),
}

export const citizenApi = {
  list: (params) => client.get('/api/citizens', { params }),
  create: (payload) => client.post('/api/citizens', payload),
  update: (id, payload) => client.patch(`/api/citizens/${id}`, payload),
  remove: (id) => client.delete(`/api/citizens/${id}`),
  importCsv: (wardId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/api/citizens/import-csv', formData, {
      params: { ward_id: wardId },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const complaintApi = {
  list: (params) => client.get('/api/complaints', { params }),
  create: (payload) => client.post('/api/complaints', payload),
  updateStatus: (id, payload) => client.patch(`/api/complaints/${id}/status`, payload),
  history: (id) => client.get(`/api/complaints/${id}/history`),
}

export const campaignApi = {
  list: (panchayatId) => client.get('/api/campaigns', { params: { panchayat_id: panchayatId } }),
  create: (payload) => client.post('/api/campaigns', payload),
  run: (id) => client.post(`/api/campaigns/${id}/run`),
  calls: (id) => client.get(`/api/campaigns/${id}/calls`),
}

export const voiceApi = {
  turn: (payload) => client.post('/api/voice-assistant/turn', payload),
}

export const schemeApi = {
  list: () => client.get('/api/schemes'),
  create: (payload) => client.post('/api/schemes', payload),
  eligible: (citizenId) => client.get(`/api/schemes/eligible/${citizenId}`),
}

export const announcementApi = {
  list: (panchayatId) => client.get('/api/announcements', { params: { panchayat_id: panchayatId } }),
  create: (payload) => client.post('/api/announcements', payload),
}

export const analyticsApi = {
  dashboard: (panchayatId) => client.get('/api/analytics/dashboard', { params: { panchayat_id: panchayatId } }),
  generateInsights: (panchayatId) => client.post('/api/analytics/insights/generate', null, { params: { panchayat_id: panchayatId } }),
  insights: (panchayatId) => client.get('/api/analytics/insights', { params: { panchayat_id: panchayatId } }),
}

export const reportApi = {
  list: (panchayatId) => client.get('/api/reports', { params: { panchayat_id: panchayatId } }),
  generate: (payload) => client.post('/api/reports/generate', payload),
  downloadUrl: (id) => `${client.defaults.baseURL}/api/reports/${id}/download`,
}

export const notificationApi = {
  list: (unreadOnly) => client.get('/api/notifications', { params: { unread_only: unreadOnly } }),
  markRead: (id) => client.patch(`/api/notifications/${id}/read`),
}
