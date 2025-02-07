import api from './api';

const bookingService = {
  getGuestBookings: async () => {
    try {
      const response = await api.get('/bookings/guest');
      return response.data;
    } catch (error) {
      console.error('Error fetching guest bookings:', error);
      throw error.response?.data?.message || 'Failed to fetch bookings';
    }
  },

  updateBooking: async (bookingId, bookingData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error.response?.data?.message || 'Failed to update booking';
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error.response?.data?.message || 'Failed to cancel booking';
    }
  },

  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error.response?.data?.message || 'Failed to create booking';
    }
  }
};

export default bookingService;
