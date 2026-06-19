import api from './api';

const reviewService = {
  create: (data) => api.post('/reviews', data),
  reply: (id, text) => api.put(`/reviews/${id}/reply`, { text }),
  markHelpful: (id) => api.put(`/reviews/${id}/helpful`),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export default reviewService;
