import api from './api';

export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
};

export const eventService = {
  create: (data) => api.post('/api/events', data),
  getAll: () => api.get('/api/events'),
  getOne: (id) => api.get(`/api/events/${id}`),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  delete: (id) => api.delete(`/api/events/${id}`),
  getByShareCode: (code) => api.get(`/api/events/share/${code}`),
};

export const wishlistService = {
  addItem: (eventId, data) => api.post(`/api/events/${eventId}/wishlist`, data),
  getItems: (eventId) => api.get(`/api/events/${eventId}/wishlist`),
  getSummary: (eventId) => api.get(`/api/events/${eventId}/wishlist/summary`),
  updateItem: (itemId, data) => api.put(`/api/wishlist/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/api/wishlist/${itemId}`),
  claimItem: (itemId, guest_token) => api.post(`/api/wishlist/${itemId}/claim`, { guest_token }),
  unclaimItem: (itemId, guest_token) => api.delete(`/api/wishlist/${itemId}/claim`, { data: { guest_token } }),
};

export const rsvpService = {
  submit: (eventId, data) => api.post(`/api/events/${eventId}/rsvp`, data),
  getList: (eventId) => api.get(`/api/events/${eventId}/rsvp`),
  getStats: (eventId) => api.get(`/api/events/${eventId}/rsvp/stats`),
  getPoll: (eventId) => api.get(`/api/events/${eventId}/rsvp/poll`),
};

export const contactService = {
  create: (data) => api.post('/api/contacts', data),
  bulkCreate: (contacts) => api.post('/api/contacts/bulk', { contacts }),
  getAll: () => api.get('/api/contacts'),
  update: (id, data) => api.put(`/api/contacts/${id}`, data),
  delete: (id) => api.delete(`/api/contacts/${id}`),
};

export const inviteService = {
  create: (eventId, contact_ids) => api.post(`/api/events/${eventId}/invitations`, { contact_ids }),
  getAll: (eventId) => api.get(`/api/events/${eventId}/invitations`),
  updateStatus: (id, status) => api.put(`/api/invitations/${id}/status`, { status }),
  getWhatsAppLink: (eventId, inviteId) => api.get(`/api/events/${eventId}/invitations/whatsapp/${inviteId}`),
};
