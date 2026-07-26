import axios from 'axios';
import Swal from 'sweetalert2';

// Resolve the API base URL.
// - In production (served from a real host by the Express server), always use a
//   same-origin relative "/api" so there are no CORS concerns and no build-time
//   URL baked in.
// - Locally (localhost / 127.0.0.1) use VITE_API_URL (dev backend / Vite proxy).
const resolveApiBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') return '/api';
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const API_BASE = resolveApiBase();

// Create a base API instance for authenticated requests
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token when available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect on auth errors if not accessing public endpoints
    if (error.response && error.response.status === 401 && !error.config.url.includes('/properties')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Create a public API instance for endpoints that don't require authentication
export const publicApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
