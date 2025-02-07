import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data); // Debug log
      
      if (response.data?.data?.token && response.data?.data?.user) {
        // Store the token securely
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        return {
          token: response.data.data.token,
          user: response.data.data.user
        };
      }
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw error.response?.data?.message || 'Failed to login';
    }
  },

  register: async ({ email, password, userType = 'guest', firstName, lastName }) => {
    try {
      const userData = {
        email,
        password,
        firstName,
        lastName,
        role: userType
      };
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data?.message || 'Failed to register';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  }
};

export default authService;
