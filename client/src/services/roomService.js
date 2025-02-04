import api from './api';

const roomService = {
  getRoom: (propertyId, roomId) => api.get(`/properties/${propertyId}/rooms/${roomId}`),
  
  getAvailability: (propertyId, roomId, startDate, endDate) => 
    api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, {
      params: { startDate, endDate }
    }),
  
  bookRoom: (propertyId, roomId, bookingData) => 
    api.post(`/properties/${propertyId}/rooms/${roomId}/book`, bookingData),

  updateAvailability: (propertyId, roomId, date, price, is_available) =>
    api.post(`/properties/${propertyId}/rooms/${roomId}/availability`, {
      date,
      price,
      is_available
    })
};

export default roomService; 