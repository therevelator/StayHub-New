import api from './api';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data); // Debug log
      
      if (response.data?.data?.token && response.data?.data?.user) {
        const userData = response.data.data.user;
        // Add role-based flags
        const userWithRoles = {
          ...userData,
          isAdmin: userData.role === 'admin',
          isHost: userData.role === 'host',
          isGuest: userData.role === 'guest'
        };
        // Store the token and user data securely
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(userWithRoles));
        return {
          token: response.data.data.token,
          user: userWithRoles
        };
      }
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw error.response?.data?.message || 'Failed to login';
    }
  },

  register: async ({ email, password, userType = 'guest', firstName, lastName, phoneNumber, propertyDetails }) => {
    try {
      // Map frontend userType to backend role
      const role = userType === 'owner' ? 'host' : userType;
      
      const userData = {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role,
        ...(role === 'host' ? { propertyDetails } : {})
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
      if (!user) return null;
      
      const userData = JSON.parse(user);
      // Ensure role flags are set
      return {
        ...userData,
        isAdmin: userData.role === 'admin',
        isHost: userData.role === 'host',
        isGuest: userData.role === 'guest'
      };
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
