import api from './api';

class PropertyOwnerService {
  async getMyProperties() {
    const response = await api.get('/owner/properties');
    return response.data;
  }

  async getPropertyById(propertyId) {
    const response = await api.get(`/owner/properties/${propertyId}`);
    return response.data;
  }

  async getPropertyBookings(propertyId) {
    const response = await api.get(`/owner/properties/${propertyId}/bookings`);
    return response.data;
  }

  // Calendar Management
  async blockDate(propertyId, data) {
    const response = await api.post(`/owner/properties/${propertyId}/calendar/block`, data);
    return response.data;
  }

  async unblockDate(propertyId, date) {
    const response = await api.delete(`/owner/properties/${propertyId}/calendar/block/${date}`);
    return response.data;
  }

  // Maintenance Tasks
  async getMaintenanceTasks(propertyId) {
    const response = await api.get(`/owner/properties/${propertyId}/maintenance`);
    return response.data;
  }

  async createMaintenanceTask(propertyId, data) {
    const response = await api.post(`/owner/properties/${propertyId}/maintenance`, data);
    return response.data;
  }

  async updateTaskStatus(propertyId, taskId, status) {
    const response = await api.patch(`/owner/properties/${propertyId}/maintenance/${taskId}/status`, { status });
    return response.data;
  }

  async deleteTask(propertyId, taskId) {
    const response = await api.delete(`/owner/properties/${propertyId}/maintenance/${taskId}`);
    return response.data;
  }

  // Messages
  async getBookingMessages(bookingId) {
    const response = await api.get(`/owner/bookings/${bookingId}/messages`);
    return response.data;
  }

  async sendMessage(bookingId, data) {
    const response = await api.post(`/owner/bookings/${bookingId}/messages`, data);
    return response.data;
  }

  async markMessagesAsRead(bookingId) {
    const response = await api.patch(`/owner/bookings/${bookingId}/messages/read`);
    return response.data;
  }

  async getUnreadCount() {
    const response = await api.get('/owner/messages/unread');
    return response.data;
  }

  // Financial Transactions
  async getPropertyTransactions(propertyId) {
    const response = await api.get(`/owner/properties/${propertyId}/transactions`);
    return response.data;
  }

  async createTransaction(propertyId, data) {
    const response = await api.post(`/owner/properties/${propertyId}/transactions`, data);
    return response.data;
  }

  async updateTransactionStatus(propertyId, transactionId, status) {
    const response = await api.patch(`/owner/properties/${propertyId}/transactions/${transactionId}/status`, { status });
    return response.data;
  }

  // Seasonal Pricing
  async getSeasonalPricing(roomId) {
    const response = await api.get(`/owner/rooms/${roomId}/seasonal-pricing`);
    return response.data;
  }

  async setSeasonalPricing(roomId, data) {
    const response = await api.post(`/owner/rooms/${roomId}/seasonal-pricing`, data);
    return response.data;
  }

  async deleteSeasonalPricing(pricingId) {
    const response = await api.delete(`/owner/seasonal-pricing/${pricingId}`);
    return response.data;
  }
}

export const propertyOwnerService = new PropertyOwnerService(); 