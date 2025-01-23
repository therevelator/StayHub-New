import api from './api';
import { uploadMultipleImages } from './imageService';

const propertyService = {
  create: async (data, images) => {
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

    // Upload images
    const uploadedImages = images.length > 0 ? await uploadMultipleImages(images) : [];

    // Add image URLs to property data
    propertyData.images = uploadedImages.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail,
      delete_url: img.delete_url
    }));

    console.log('PropertyService: Formatted data:', propertyData);
    
    try {
      const response = await api.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('PropertyService: Error creating property:', error);
      throw error;
    }
  },
  update: async (id, data, images) => {
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

    // Upload images
    const uploadedImages = images.length > 0 ? await uploadMultipleImages(images) : [];

    // Add image URLs to property data
    propertyData.images = uploadedImages.map(img => ({
      url: img.url,
      thumbnail: img.thumbnail,
      delete_url: img.delete_url
    }));

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
      console.log('[PropertyService] Fetching property:', id);
      const response = await api.get(`/properties/${id}`);
      console.log('[PropertyService] Raw response:', response);
      
      if (!response.data || !response.data.data) {
        throw new Error('No data received from server');
      }
      
      // Parse the rooms data
      const propertyData = response.data.data;
      if (propertyData.rooms) {
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
      }
      
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
  updateRoom: async (propertyId, roomId, roomData, images) => {
    console.log('[PropertyService] Updating room with data:', roomData);
    try {
      // Format the data to match the expected structure
      const formattedData = {
        ...roomData,
        property_id: propertyId,
        // Ensure arrays are stringified
        beds: typeof roomData.beds === 'string' ? roomData.beds : JSON.stringify(roomData.beds || []),
        amenities: typeof roomData.amenities === 'string' ? roomData.amenities : JSON.stringify(roomData.amenities || [])
      };

      // Upload room images
      const uploadedImages = images.length > 0 ? await uploadMultipleImages(images) : [];

      // Add image URLs to room data
      formattedData.images = uploadedImages.map(img => ({
        url: img.url,
        thumbnail: img.thumbnail,
        delete_url: img.delete_url
      }));

      console.log('[PropertyService] Sending formatted data:', formattedData);
      const response = await api.put(`/properties/${propertyId}/rooms/${roomId}`, formattedData);
      console.log('[PropertyService] Received response:', response.data);
      
      // Ensure we have the data property
      if (!response.data || !response.data.data) {
        console.error('[PropertyService] Invalid response format:', response);
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
      
      console.log('[PropertyService] Returning parsed data:', parsedData);
      return { ...response.data, data: parsedData };
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
  getRoomAvailability: async (propertyId, roomId) => {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/${roomId}/availability`);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error getting room availability:', error);
      throw error;
    }
  },
  updateRoomAvailability: async (propertyId, roomId, data) => {
    try {
      const response = await api.post(`/properties/${propertyId}/rooms/${roomId}/availability`, data);
      return response.data;
    } catch (error) {
      console.error('[PropertyService] Error updating room availability:', error);
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
  }
};

export default propertyService;
