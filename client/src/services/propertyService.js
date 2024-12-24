import api from './api';

const propertyService = {
  create: async (data) => {
    console.log('PropertyService: Creating property with data:', data);
    
    // Format the data to match the expected structure
    const propertyData = {
      name: data.name?.trim(),
      description: data.description?.trim(),
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      street: data.street?.trim(),
      city: data.city?.trim(),
      state: data.state?.trim(),
      country: data.country?.trim(),
      postal_code: data.postal_code?.trim(),
      host_id: data.host_id,
      guests: parseInt(data.guests) || 1,
      bedrooms: parseInt(data.bedrooms) || 1,
      beds: parseInt(data.beds) || 1,
      bathrooms: parseFloat(data.bathrooms) || 1,
      property_type: data.property_type,
      check_in_time: data.check_in_time || '14:00:00',
      check_out_time: data.check_out_time || '11:00:00',
      cancellation_policy: data.cancellation_policy || 'flexible',
      pet_policy: data.pet_policy?.trim(),
      event_policy: data.event_policy?.trim(),
      star_rating: parseInt(data.star_rating) || 0,
      languages_spoken: Array.isArray(data.languages_spoken) ? data.languages_spoken : [],
      is_active: data.is_active ? 1 : 0,
      // Update photos structure to match backend expectation
      imageUrl: data.photos?.[0]?.url || null,
      photos: Array.isArray(data.photos) ? data.photos.map(photo => ({
        url: photo.url,
        caption: photo.caption || ''
      })) : [],
      rooms: data.rooms?.map(room => ({
        ...room,
        beds: typeof room.beds === 'string' ? room.beds : JSON.stringify(room.beds || [])
      })) || []
    };

    console.log('PropertyService: Formatted data:', propertyData);
    
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error creating property:', error);
      throw error;
    }
  },
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getById: (id) => api.get(`/properties/${id}`),
  search: (params) => api.get('/properties/search', { params }),
  getAll: () => api.get('/properties'),
  updateStatus: (id, status) => api.patch(`/properties/${id}/status`, { status })
};

export default propertyService;
