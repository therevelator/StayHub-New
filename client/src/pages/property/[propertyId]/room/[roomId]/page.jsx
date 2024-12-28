const fetchAvailableDates = async () => {
  try {
    const response = await api.get(`/properties/rooms/${roomId}/availability`);
    setAvailableDates(response.data.availableDates);
  } catch (error) {
    console.error('Error fetching available dates:', error);
    setAvailableDates([]);
  }
}; 