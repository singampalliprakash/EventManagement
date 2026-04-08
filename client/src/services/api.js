import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// For Android Emulator, use 10.0.2.2. For Web, use VITE_API_URL or Vite Proxy
const buildApiUrl = import.meta.env.VITE_API_URL || '';
const baseURL = Capacitor.isNativePlatform() ? 'http://10.0.2.2:5000' : buildApiUrl;

const api = axios.create({
  baseURL: baseURL,
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
