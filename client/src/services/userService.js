import api from './api';

const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  }
};

export default userService;
