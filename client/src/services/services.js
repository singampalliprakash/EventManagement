import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const eventService = {
  create: (data) => api.post('/events', data),
  getAll: () => api.get('/events'),
  getOne: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getByShareCode: (code) => api.get(`/events/share/${code}`),
};

export const wishlistService = {
  addItem: (eventId, data) => api.post(`/events/${eventId}/wishlist`, data),
  getItems: (eventId) => api.get(`/events/${eventId}/wishlist`),
  updateItem: (itemId, data) => api.put(`/wishlist/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/wishlist/${itemId}`),
  claimItem: (itemId, guest_token) => api.post(`/wishlist/${itemId}/claim`, { guest_token }),
  unclaimItem: (itemId, guest_token) => api.delete(`/wishlist/${itemId}/claim`, { data: { guest_token } }),
};

export const rsvpService = {
  submit: (eventId, data) => api.post(`/events/${eventId}/rsvp`, data),
  getList: (eventId) => api.get(`/events/${eventId}/rsvp`),
  getStats: (eventId) => api.get(`/events/${eventId}/rsvp/stats`),
};

export const contactService = {
  create: (data) => api.post('/contacts', data),
  getAll: () => api.get('/contacts'),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
};

export const inviteService = {
  create: (eventId, contact_ids) => api.post(`/events/${eventId}/invitations`, { contact_ids }),
  getAll: (eventId) => api.get(`/events/${eventId}/invitations`),
  updateStatus: (id, status) => api.put(`/invitations/${id}/status`, { status }),
  getWhatsAppLink: (eventId, inviteId) => api.get(`/events/${eventId}/invitations/whatsapp/${inviteId}`),
};
