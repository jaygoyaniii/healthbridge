import api from './api';

const doctorService = {
  getDoctors: (params) => api.get('/doctors', { params }),
  searchDoctors: (q) => api.get('/doctors/search', { params: { q } }),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
  registerDoctor: (data) => api.post('/doctors/register', data),
  updateDoctor: (id, data) => api.put(`/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/doctors/${id}`),

  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  updateSchedule: (id, data) => api.post(`/doctors/${id}/slots`, data),
  deleteSlotsForDate: (id, date, reason) => api.delete(`/doctors/${id}/slots/${date}`, { data: { reason } }),

  getAppointments: (id, params) => api.get(`/doctors/${id}/appointments`, { params }),
  getPatients: (id) => api.get(`/doctors/${id}/patients`),
  getPatientDetail: (id, patientId) => api.get(`/doctors/${id}/patients/${patientId}`),
  getReviews: (id, params) => api.get(`/doctors/${id}/reviews`, { params }),
  getEarnings: (id) => api.get(`/doctors/${id}/earnings`),
};

export default doctorService;
