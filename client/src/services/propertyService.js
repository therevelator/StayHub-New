import api from './api';

const propertyService = {
  create: async (data) => {
    console.log('%c Property Service - Creating Property', 'background: #222; color: #bada55');
    console.log('Input data:', data);
    
    // Always use current date with the specified time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const baseDate = `${year}-${month}-${day}`;

    // Format the rules data
    const formattedRules = {
      ...data.rules,
      checkInTime: `${baseDate}T14:00:00.000Z`,  // Default 2 PM
      checkOutTime: `${baseDate}T11:00:00.000Z`   // Default 11 AM
    };
    
    const formattedData = {
      ...data,
      rules: formattedRules
    };
    
    console.log('Sending to server:', formattedData);
    console.log('%c End Property Creation Log', 'background: #222; color: #bada55');
    
    return api.post('/properties', formattedData);
  },
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getById: (id) => api.get(`/properties/${id}`),
  search: (params) => api.get('/properties/search', { params }),
  getAll: () => api.get('/properties'),
  updateStatus: (id, status) => api.patch(`/properties/${id}/status`, { status })
};

export default propertyService;
