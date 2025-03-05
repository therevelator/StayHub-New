import api from './api';
import { uploadMultipleImages } from './imageService';

const propertyService = {
  createProperty: async (data) => {
    try {
      const response = await api.post('/owner/properties', data);
      return response.data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },
  create: async (data, images = []) => {
    console.log('PropertyService: Creating property with data:', data);
    
    try {
      // Format the main property data
      // Validate required location fields
      if (!data.city || !data.country) {
        throw new Error('City and country are required fields');
      }

      const propertyData = {
        name: data.name?.trim(),
        description: data.description?.trim(),
        latitude: data.latitude || null,
        longitude: data.longitude || null,
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
        pet_policy: data.pet_policy?.trim() || '',
        event_policy: data.event_policy?.trim() || '',
        star_rating: parseInt(data.star_rating) || 0,
        languages_spoken: data.languages_spoken || [],
        is_active: data.is_active ? 1 : 0,
        house_rules: data.house_rules?.trim() || '',
        min_stay: parseInt(data.min_stay) || 1,
        max_stay: parseInt(data.max_stay) || 30,
        rooms: data.rooms || [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      // Upload images if any
      if (images.length > 0) {
        const uploadedImages = await uploadMultipleImages(images);
        propertyData.images = uploadedImages.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail,
          delete_url: img.delete_url
        }));
      }

      console.log('PropertyService: Sending formatted data to server:', propertyData);
      
      // Create the property
      const propertyResponse = await api.post('/properties', propertyData);
      console.log('PropertyService: Property creation response:', propertyResponse.data);
      
      if (!propertyResponse.data) {
        throw new Error('No data received from server');
      }

      // Return success with the created property data
      return {
        status: 'success',
        data: propertyResponse.data
      };
    } catch (error) {
      console.error('PropertyService: Error creating property:', error);
      throw error; // Let the component handle the error
    }
  },
  update: async (id, data, images = []) => {
    console.log('[PropertyService] Update called with ID:', id);
    console.log('[PropertyService] Raw update data:', data);
    
    // Create a clean object with only valid fields
    const updateData = {};
    
    // Basic info fields
    if (data.name) updateData.name = data.name.trim();
    if (data.description) updateData.description = data.description.trim();
    if (data.property_type) updateData.property_type = data.property_type;
    if (data.guests !== undefined) updateData.guests = parseInt(data.guests) || 1;
    if (data.bedrooms !== undefined) updateData.bedrooms = parseInt(data.bedrooms) || 1;
    if (data.beds !== undefined) updateData.beds = parseInt(data.beds) || 1;
    if (data.bathrooms !== undefined) updateData.bathrooms = parseFloat(data.bathrooms) || 1;
    if (data.star_rating !== undefined) updateData.star_rating = parseFloat(data.star_rating) || 0;
    
    // Handle location fields
    if (data.street) updateData.street = data.street.trim();
    if (data.city) {
      if (!data.city.trim()) {
        throw new Error('City cannot be empty');
      }
      updateData.city = data.city.trim();
    }
    if (data.state) updateData.state = data.state.trim();
    if (data.country) {
      if (!data.country.trim()) {
        throw new Error('Country cannot be empty');
      }
      updateData.country = data.country.trim();
    }
    if (data.postal_code) updateData.postal_code = data.postal_code.trim();
    if (data.latitude) updateData.latitude = parseFloat(data.latitude);
    if (data.longitude) updateData.longitude = parseFloat(data.longitude);
    
    // Policy fields
    if (data.check_in_time) updateData.check_in_time = data.check_in_time;
    if (data.check_out_time) updateData.check_out_time = data.check_out_time;
    if (data.cancellation_policy) updateData.cancellation_policy = data.cancellation_policy;
    if (data.pet_policy) updateData.pet_policy = data.pet_policy;
    if (data.event_policy) updateData.event_policy = data.event_policy;
    if (data.house_rules) updateData.house_rules = data.house_rules;
    if (data.min_stay) updateData.min_stay = parseInt(data.min_stay);
    if (data.max_stay) updateData.max_stay = parseInt(data.max_stay);
    
    // Status fields
    if ('is_active' in data) {
      updateData.is_active = data.is_active ? 1 : 0;
    }
    if (data.languages_spoken) {
      updateData.languages_spoken = JSON.stringify(
        Array.isArray(data.languages_spoken) ? data.languages_spoken : []
      );
    }
    
    // Upload images if any
    if (images.length > 0) {
      const uploadedImages = await uploadMultipleImages(images);
      updateData.images = uploadedImages.map(img => ({
        url: img.url,
        thumbnail: img.thumbnail,
        delete_url: img.delete_url
      }));
    }
    
    console.log('[PropertyService] Cleaned update data:', updateData);
    
    try {
      const response = await api.put(`/properties/${id}`, updateData);
      console.log('[PropertyService] Response:', response.data);
      
      if (response.data?.status !== 'success') {
        throw new Error(response.data?.message || 'Failed to update property');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('[PropertyService] Error updating property:', error);
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
  deleteProperty: async (id) => {
    try {
      const response = await api.delete(`/properties/${id}`);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error deleting property:', error);
      
      // Add more detailed error information
      if (error.response && error.response.data && error.response.data.message) {
        const enhancedError = new Error(error.response.data.message);
        enhancedError.response = error.response;
        enhancedError.status = error.response.status;
        throw enhancedError;
      }
      
      throw error;
    }
  },
  getById: async (id) => {
    try {
      console.log('[PropertyService] Fetching property:', id);
      const response = await api.get(`/properties/${id}`);
      console.log('[PropertyService] Raw response:', response);
      
      if (!response.data || !response.data.data) {
        throw new Error('No data received from server');
      }
      
      // Parse the rooms data
      const propertyData = response.data.data;
      if (propertyData.rooms && Array.isArray(propertyData.rooms)) {
        propertyData.rooms = propertyData.rooms.map(room => ({
          ...room,
          beds: typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds,
          amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities,
          accessibility_features: typeof room.accessibility_features === 'string' ? 
            JSON.parse(room.accessibility_features) : room.accessibility_features,
          energy_saving_features: typeof room.energy_saving_features === 'string' ? 
            JSON.parse(room.energy_saving_features) : room.energy_saving_features,
          images: typeof room.images === 'string' ? JSON.parse(room.images) : room.images
        }));
      } else {
        propertyData.rooms = [];
      }

      // Handle house_rules - ensure it's always a string
      propertyData.house_rules = Array.isArray(propertyData.house_rules) ? 
        propertyData.house_rules.join('\n') : 
        (propertyData.house_rules || '');
      
      console.log('[PropertyService] Parsed property data:', propertyData);
      return propertyData;
    } catch (error) {
      console.error('[PropertyService] Error getting property:', error);
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
  createRoom: async (propertyId, roomData, images = []) => {
    console.log('[PropertyService] Creating room with data:', roomData);
    try {
      // Upload room images if they exist
      const uploadedImages = images && images.length > 0 ? await uploadMultipleImages(images) : [];

      // Add image URLs to room data and ensure proper JSON stringification
      const roomWithImages = {
        ...roomData,
        property_id: propertyId,
        beds: Array.isArray(roomData.beds) ? JSON.stringify(roomData.beds) : '[]',
        amenities: Array.isArray(roomData.amenities) ? JSON.stringify(roomData.amenities) : '[]',
        accessibility_features: Array.isArray(roomData.accessibility_features) ? JSON.stringify(roomData.accessibility_features) : '[]',
        climate: roomData.climate ? JSON.stringify(roomData.climate) : 'null',
        images: JSON.stringify(uploadedImages.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail,
          delete_url: img.delete_url
        }))),
        energy_saving_features: Array.isArray(roomData.energy_saving_features) ? JSON.stringify(roomData.energy_saving_features) : '[]'
      };

      const response = await api.post(`/properties/${propertyId}/rooms`, roomWithImages);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error creating room:', error);
      throw error;
    }
  },
  getRoom: async (propertyId, roomId) => {
    try {
      console.log('[PropertyService] Fetching room:', { propertyId, roomId });
      const response = await api.get(`/properties/${propertyId}/rooms/${roomId}`);
      console.log('[PropertyService] Room response:', response.data);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Parse the stringified fields in the response
      const parsedData = {
        ...response.data.data,
        beds: typeof response.data.data.beds === 'string' ? JSON.parse(response.data.data.beds) : response.data.data.beds,
        amenities: typeof response.data.data.amenities === 'string' ? JSON.parse(response.data.data.amenities) : response.data.data.amenities,
        accessibility_features: typeof response.data.data.accessibility_features === 'string' ? 
          JSON.parse(response.data.data.accessibility_features) : response.data.data.accessibility_features,
        energy_saving_features: typeof response.data.data.energy_saving_features === 'string' ? 
          JSON.parse(response.data.data.energy_saving_features) : response.data.data.energy_saving_features,
        images: typeof response.data.data.images === 'string' ? JSON.parse(response.data.data.images) : response.data.data.images
      };
      
      console.log('[PropertyService] Parsed room data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('[PropertyService] Error fetching room:', error);
      throw error;
    }
  },
  updateRoom: async (propertyId, roomId, roomData, images = []) => {
    console.log('[PropertyService] Updating room with data:', roomData);
    try {
      // Format the data to match the expected structure
      const formattedData = {
        ...roomData,
        property_id: propertyId,
        // Ensure arrays are stringified
        beds: JSON.stringify(Array.isArray(roomData.beds) ? roomData.beds : []),
        amenities: JSON.stringify(Array.isArray(roomData.amenities) ? roomData.amenities : []),
        accessibility_features: JSON.stringify(Array.isArray(roomData.accessibility_features) ? roomData.accessibility_features : []),
        energy_saving_features: JSON.stringify(Array.isArray(roomData.energy_saving_features) ? roomData.energy_saving_features : []),
        // Ensure numeric values
        price_per_night: Number(roomData.price_per_night) || 0,
        base_price: Number(roomData.base_price) || 0,
        max_occupancy: Number(roomData.max_occupancy) || 2,
        floor_level: Number(roomData.floor_level) || 1,
        room_size: Number(roomData.room_size) || 0,
        // Ensure boolean values
        has_private_bathroom: Boolean(roomData.has_private_bathroom),
        smoking: Boolean(roomData.smoking),
        has_balcony: Boolean(roomData.has_balcony),
        has_kitchen: Boolean(roomData.has_kitchen),
        has_minibar: Boolean(roomData.has_minibar),
        includes_breakfast: Boolean(roomData.includes_breakfast),
        extra_bed_available: Boolean(roomData.extra_bed_available),
        pets_allowed: Boolean(roomData.pets_allowed),
        has_toiletries: Boolean(roomData.has_toiletries),
        has_towels_linens: Boolean(roomData.has_towels_linens),
        has_room_service: Boolean(roomData.has_room_service)
      };

      // Upload room images if provided
      if (images.length > 0) {
        const uploadedImages = await uploadMultipleImages(images);
        formattedData.images = JSON.stringify(uploadedImages.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail,
          delete_url: img.delete_url
        })));
      }

      console.log('[PropertyService] Sending formatted data:', formattedData);
      const response = await api.put(`/properties/${propertyId}/rooms/${roomId}`, formattedData);
      console.log('[PropertyService] Received response:', response.data);
      
      // Handle both success response formats
      const responseData = response.data?.data || response.data;
      if (!responseData) {
        console.error('[PropertyService] Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
      
      // Safely parse JSON fields
      const safeParseJson = (str, defaultValue = []) => {
        if (!str) return defaultValue;
        if (typeof str !== 'string') return str;
        try {
          return JSON.parse(str);
        } catch (e) {
          console.warn(`[PropertyService] Failed to parse JSON:`, e);
          return defaultValue;
        }
      };

      // Parse the stringified fields in the response
      const parsedData = {
        ...responseData,
        beds: safeParseJson(responseData.beds),
        amenities: safeParseJson(responseData.amenities),
        accessibility_features: safeParseJson(responseData.accessibility_features),
        energy_saving_features: safeParseJson(responseData.energy_saving_features),
        images: safeParseJson(responseData.images),
        climate: safeParseJson(responseData.climate, { type: 'ac', available: true })
      };
      
      console.log('[PropertyService] Returning parsed data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('[PropertyService] Error updating room:', error);
      throw error;
    }
  },
  deleteRoom: async (propertyId, roomId) => {
    try {
      const response = await api.delete(`/properties/${propertyId}/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error deleting room:', error);
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
  },
  updatePropertyImages: async (propertyId, images) => {
    try {
      const uploadedImages = await uploadMultipleImages(images);
      const response = await api.post(`/properties/${propertyId}/images`, {
        images: uploadedImages.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail,
          delete_url: img.delete_url
        }))
      });
      return response.data;
    } catch (error) {
      console.error('Error updating property images:', error);
      throw error;
    }
  },
  updateRoomImages: async (propertyId, roomId, images) => {
    try {
      const uploadedImages = await uploadMultipleImages(images);
      const response = await api.post(`/properties/${propertyId}/rooms/${roomId}/images`, {
        images: uploadedImages.map(img => ({
          url: img.url,
          thumbnail: img.thumbnail,
          delete_url: img.delete_url
        }))
      });
      return response.data;
    } catch (error) {
      console.error('Error updating room images:', error);
      throw error;
    }
  },
  getRoomAvailability: async (propertyId, roomId, startDate, endDate) => {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/${roomId}/availability`, {
        params: {
          startDate,
          endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error getting room availability:', error);
      throw error;
    }
  },
  updateRoomAvailability: async (propertyId, roomId, data) => {
    try {
      const response = await api.post(`/properties/${propertyId}/rooms/${roomId}/availability`, data);
      return response;
    } catch (error) {
      console.error('Error updating room availability:', error);
      throw error;
    }
  },
  updateBooking: async (bookingId, data) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, data);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error updating booking:', error);
      throw error;
    }
  },
  cancelBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error cancelling booking:', error);
      throw error;
    }
  },
  getRoomReservations: async (propertyId, roomId) => {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/${roomId}/reservations`);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error getting room reservations:', error);
      throw error;
    }
  },
  getBookings: async (propertyId) => {
    try {
      const response = await api.get(`/properties/${propertyId}/bookings`);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error getting property bookings:', error);
      throw error;
    }
  }
};

export default propertyService;
