import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://eventmanagement-production-ba6c.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventwise_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('eventwise_token');
      localStorage.removeItem('eventwise_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/event/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
