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
      languages_spoken: JSON.stringify(Array.isArray(data.languages_spoken) ? data.languages_spoken : []),
      is_active: data.is_active ? 1 : 0,
      rooms: data.rooms || [],
      photos: data.photos?.map(photo => ({
        url: photo.url,
        caption: photo.caption || null
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
  update: async (id, data) => {
    console.log('[PropertyService] Update called with ID:', id);
    console.log('[PropertyService] Raw update data:', data);
    
    // Initialize propertyData with only the fields that are present in the input data
    const propertyData = {};

    // Handle basic info fields
    if ('name' in data) {
      propertyData.name = data.name?.trim() || '';
      propertyData.description = data.description?.trim() || '';
      propertyData.property_type = data.property_type;
      propertyData.guests = parseInt(data.guests) || 0;
      propertyData.bedrooms = parseInt(data.bedrooms) || 0;
      propertyData.beds = parseInt(data.beds) || 0;
      propertyData.bathrooms = parseFloat(data.bathrooms) || 0;
      propertyData.star_rating = parseFloat(data.star_rating) || 0;
    }

    // Handle location fields
    if ('street' in data) {
      propertyData.street = data.street?.trim() || '';
      propertyData.city = data.city?.trim() || '';
      propertyData.state = data.state?.trim() || '';
      propertyData.country = data.country?.trim() || '';
      propertyData.postal_code = data.postal_code?.trim() || '';
      propertyData.latitude = data.latitude || '0';
      propertyData.longitude = data.longitude || '0';
    }

    // Handle policies fields
    if ('check_in_time' in data) {
      propertyData.check_in_time = data.check_in_time;
      propertyData.check_out_time = data.check_out_time;
      propertyData.cancellation_policy = data.cancellation_policy;
      propertyData.pet_policy = data.pet_policy?.trim();
      propertyData.event_policy = data.event_policy?.trim();
      propertyData.house_rules = data.house_rules?.trim();
      propertyData.min_stay = parseInt(data.min_stay) || 1;
      propertyData.max_stay = parseInt(data.max_stay) || 30;
    }

    // Handle status fields
    if ('is_active' in data) {
      propertyData.is_active = data.is_active ? 1 : 0;
      if (data.languages_spoken) {
        propertyData.languages_spoken = JSON.stringify(
          Array.isArray(data.languages_spoken) ? data.languages_spoken : []
        );
      }
    }
    
    console.log('[PropertyService] Formatted update data:', propertyData);
    console.log('[PropertyService] Making PUT request to:', `/properties/${id}`);
    
    try {
      console.log('[PropertyService] Sending request...');
      const response = await api.put(`/properties/${id}`, propertyData);
      console.log('[PropertyService] Response received:', response);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error in update:', error);
      console.error('[PropertyService] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error deleting property:', error);
      throw error;
    }
  },
  getById: async (id) => {
    try {
      console.log('PropertyService: Fetching property:', id);
      const response = await api.get(`/properties/${id}`);
      console.log('PropertyService: Raw response:', response);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Return the property data directly
      return response.data.data;
    } catch (error) {
      console.error('PropertyService: Error getting property:', error);
      throw error;
    }
  },
  search: (params) => api.get('/properties/search', { params }),
  getAll: async () => {
    try {
      const response = await api.get('/properties');
      console.log('API Response:', response);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch properties:', error);
      throw error;
    }
  },
  updateStatus: (id, status) => api.patch(`/properties/${id}/status`, { status }),
  createRoom: async (propertyId, roomData) => {
    console.log('PropertyService: Creating room with data:', roomData);
    try {
      const response = await api.post(`/properties/${propertyId}/rooms`, roomData);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error creating room:', error);
      throw error;
    }
  },
  updateRoom: async (propertyId, roomId, roomData) => {
    console.log('PropertyService: Updating room with data:', roomData);
    try {
      const response = await api.put(`/properties/${propertyId}/rooms/${roomId}`, roomData);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error updating room:', error);
      throw error;
    }
  },
  deleteRoom: async (propertyId, roomId) => {
    try {
      const response = await api.delete(`/properties/${propertyId}/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error deleting room:', error);
      throw error;
    }
  },
  uploadPhotos: async (propertyId, formData) => {
    try {
      const response = await api.post(`/properties/${propertyId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error uploading photos:', error);
      throw error;
    }
  },
  deletePhoto: async (propertyId, photoId) => {
    try {
      const response = await api.delete(`/properties/${propertyId}/photos/${photoId}`);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error deleting photo:', error);
      throw error;
    }
  },
  updatePhotoCaption: async (propertyId, photoId, data) => {
    try {
      const response = await api.put(`/properties/${propertyId}/photos/${photoId}`, data);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error updating photo caption:', error);
      throw error;
    }
  }
};

export default propertyService;
