import api from './api';

const chatService = {
  getUnreadCount: () => api.get('/chat/unread-count'),
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (participantId) => api.post('/chat/conversations', { participantId }),
  getConversationById: (id, params) => api.get(`/chat/conversations/${id}`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
  markAsRead: (id) => api.put(`/chat/messages/${id}/read`),
  
  clearConversation: (id) => api.delete(`/chat/conversations/${id}/clear`),
  
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default chatService;
