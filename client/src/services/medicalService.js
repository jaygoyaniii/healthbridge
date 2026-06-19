import api from './api';

const medicalService = {
  getRecords: (params) => api.get('/medical-records', { params }),
  deleteRecord: (id) => api.delete(`/medical-records/${id}`),
  updateSharing: (id, sharedWith) => api.put(`/medical-records/${id}/share`, { sharedWith }),
  
  uploadRecord: (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('type', data.type);
    formData.append('description', data.description || '');
    formData.append('file', data.file);
    if (data.sharedWith) {
      data.sharedWith.forEach((id) => formData.append('sharedWith[]', id));
    }

    return api.post('/medical-records', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default medicalService;
