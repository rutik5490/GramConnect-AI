import client from './client'

export const publicApi = {
  panchayats: () => client.get('/api/citizen/panchayats'),
  wards: (panchayatId) => client.get('/api/citizen/wards', { params: { panchayat_id: panchayatId } }),
}

export const citizenAuthApi = {
  requestOtp: (mobileNumber) => client.post('/api/citizen/auth/request-otp', { mobile_number: mobileNumber }),
  selfRegister: (payload) => client.post('/api/citizen/auth/self-register', payload),
  verifyOtp: (mobileNumber, otp) =>
    client.post('/api/citizen/auth/verify-otp', { mobile_number: mobileNumber, otp }),
  me: () => client.get('/api/citizen/me'),
}

export const citizenApi = {
  myComplaints: () => client.get('/api/citizen/complaints'),
  fileComplaint: (description) => client.post('/api/citizen/complaints', { description }),
  myAnnouncements: () => client.get('/api/citizen/announcements'),
  myEligibleSchemes: () => client.get('/api/citizen/schemes/eligible'),
  voiceTurn: (payload) => client.post('/api/citizen/voice-assistant/turn', payload),
}
