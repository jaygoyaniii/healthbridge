import api from './api';

const prescriptionService = {
  create: (data) => api.post('/prescriptions', data),
  getPrescriptions: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
};

export default prescriptionService;
