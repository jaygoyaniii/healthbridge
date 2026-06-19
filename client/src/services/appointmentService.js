import api from './api';

const appointmentService = {
  bookAppointment: (data) => api.post('/appointments', data),
  getAppointments: (params) => api.get('/appointments', { params }),
  getUpcoming: () => api.get('/appointments/upcoming'),
  getToday: () => api.get('/appointments/today'),
  getById: (id) => api.get(`/appointments/${id}`),
  
  confirm: (id) => api.put(`/appointments/${id}/confirm`),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  markNoShow: (id) => api.put(`/appointments/${id}/no-show`),
  updateNotes: (id, notes) => api.put(`/appointments/${id}/notes`, { notes }),
  getReceipt: (id) => api.get(`/appointments/${id}/receipt`),
};

export default appointmentService;
