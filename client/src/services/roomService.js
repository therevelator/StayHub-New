import api from './api';

const roomService = {
  getRoom: (roomId) => api.get(`/properties/rooms/${roomId}`),
  
  getAvailability: (roomId) => api.get(`/properties/rooms/${roomId}/availability`),
  
  bookRoom: (roomId, bookingData) => api.post(`/properties/rooms/${roomId}/book`, bookingData)
};

export default roomService; 