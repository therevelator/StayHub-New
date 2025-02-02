import axios from 'axios';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an invalid token and we haven't tried to refresh yet
    if ((error.response?.data?.message === 'Invalid token' || 
         error.response?.status === 401) && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await api.post('/auth/refresh-token');
        const { token } = response.data;

        if (token) {
          // Save the new token
          localStorage.setItem('token', token);
          
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, show error and redirect to login
        Swal.fire({
          title: 'Session Expired',
          text: 'Your session has expired. You will be redirected to login page.',
          icon: 'warning',
          timer: 5000,
          timerProgressBar: true,
          showConfirmButton: false
        }).then(() => {
          // Clear any stored auth data
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          
          // Redirect to login
          window.location.href = '/login';
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
