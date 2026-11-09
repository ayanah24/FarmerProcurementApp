import axios from 'axios';

const api = axios.create({
  // In production (Docker), Nginx proxies /api/ to the backend container.
  // In dev (vite dev server), set VITE_API_URL=http://localhost:5000/api in .env.local
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
