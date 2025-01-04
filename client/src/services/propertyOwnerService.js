import api from './api';

const propertyOwnerService = {
  // Properties
  getMyProperties: async () => {
    return await api.get('/owner/properties');
  },

  getPropertyBookings: async (propertyId) => {
    return await api.get(`/owner/properties/${propertyId}/bookings`);
  },

  // Calendar Management
  getBlockedDates: async (propertyId) => {
    return await api.get(`/owner/properties/${propertyId}/blocked-dates`);
  },

  blockDates: async (propertyId, data) => {
    return await api.post(`/owner/properties/${propertyId}/blocked-dates`, data);
  },

  unblockDates: async (blockId) => {
    return await api.delete(`/owner/blocked-dates/${blockId}`);
  },

  // Maintenance Management
  getMaintenanceTasks: async (propertyId) => {
    return await api.get(`/owner/properties/${propertyId}/maintenance`);
  },

  createMaintenanceTask: async (propertyId, data) => {
    return await api.post(`/owner/properties/${propertyId}/maintenance`, data);
  },

  updateTaskStatus: async (taskId, status) => {
    return await api.patch(`/owner/maintenance/${taskId}/status`, { status });
  },

  deleteTask: async (taskId) => {
    return await api.delete(`/owner/maintenance/${taskId}`);
  },

  // Guest Communication
  getBookingMessages: async (bookingId) => {
    return await api.get(`/owner/bookings/${bookingId}/messages`);
  },

  sendMessage: async (bookingId, data) => {
    return await api.post(`/owner/bookings/${bookingId}/messages`, data);
  },

  markMessagesAsRead: async (bookingId) => {
    return await api.patch(`/owner/bookings/${bookingId}/messages/read`);
  },

  getUnreadCount: async () => {
    return await api.get('/owner/messages/unread');
  },

  // Financial Management
  getPropertyTransactions: async (propertyId) => {
    return await api.get(`/owner/properties/${propertyId}/transactions`);
  },

  createTransaction: async (propertyId, data) => {
    return await api.post(`/owner/properties/${propertyId}/transactions`, data);
  },

  updateTransactionStatus: async (transactionId, status) => {
    return await api.patch(`/owner/transactions/${transactionId}/status`, { status });
  },

  // Seasonal Pricing
  getSeasonalPricing: async (propertyId) => {
    return await api.get(`/owner/properties/${propertyId}/seasonal-pricing`);
  },

  setSeasonalPricing: async (roomId, data) => {
    return await api.post(`/owner/rooms/${roomId}/seasonal-pricing`, data);
  },

  deleteSeasonalPricing: async (pricingId) => {
    return await api.delete(`/owner/seasonal-pricing/${pricingId}`);
  },

  // Analytics
  getPropertyAnalytics: async (propertyId, startDate, endDate) => {
    return await api.get(`/owner/properties/${propertyId}/analytics`, {
      params: { startDate, endDate }
    });
  }
};

export default propertyOwnerService; 