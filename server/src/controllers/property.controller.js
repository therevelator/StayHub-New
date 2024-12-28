import { findPropertiesInRadius, getPropertyDetails, getPropertyById as getProperty, updateProperty as update, deleteProperty } from '../models/property.model.js';
import { createRoom, getRoomsByPropertyId } from '../models/room.model.js';
import axios from 'axios';
import db from '../db/index.js';

// Function to map frontend property types to database enum values
const mapPropertyType = (frontendType) => {
  const validTypes = ['hotel', 'apartment', 'villa', 'resort', 'guesthouse', 'hostel'];
  const type = frontendType?.toLowerCase();
  return validTypes.includes(type) ? type : 'hotel';
};

// Function to get coordinates from address using OpenStreetMap Nominatim
const getCoordinates = async (address) => {
  try {
    console.log('Geocoding address:', address);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
    console.log('Geocoding URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'StayHub Property Listing App'
      }
    });

    console.log('Geocoding response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      console.log('Found coordinates:', { latitude: lat, longitude: lon });
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    }
    throw new Error('Location not found');
  } catch (error) {
    console.error('Geocoding error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw new Error('Failed to get coordinates for the address');
  }
};

const searchProperties = async (req, res) => {
  try {
    const { location, guests = 1, type, lat, lon, radius = 25 } = req.query;
    console.log('Search params:', { location, guests, type, lat, lon, radius });

    let query = `
      SELECT 
        p.*,
        u.email as host_email,
        u.first_name as host_first_name,
        u.last_name as host_last_name,
        (
          SELECT pi.url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          LIMIT 1
        ) as imageUrl,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'type', r.room_type,
              'beds', r.beds,
              'maxOccupancy', r.max_occupancy,
              'basePrice', r.base_price,
              'cleaningFee', r.cleaning_fee,
              'serviceFee', r.service_fee,
              'taxRate', r.tax_rate,
              'securityDeposit', r.security_deposit
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms,
    `;

    // Add distance calculation when coordinates are provided
    if (lat && lon) {
      query += `
        ST_Distance_Sphere(
          point(p.longitude, p.latitude),
          point(?, ?)
        ) * 0.001 as distance_km
      `;
    } else {
      query += ` NULL as distance_km`;
    }

    query += ` FROM properties p
      LEFT JOIN users u ON p.host_id = u.id COLLATE utf8mb4_unicode_ci
      WHERE p.is_active = 1
    `;

    const queryParams = [];
    if (lat && lon) {
      queryParams.push(parseFloat(lon), parseFloat(lat));
    }

    if (guests) {
      query += ' AND p.guests >= ?';
      queryParams.push(parseInt(guests));
    }

    if (type) {
      query += ' AND p.property_type = ?';
      queryParams.push(type);
    }

    if (location) {
      query += ' AND (LOWER(p.city) LIKE ? OR LOWER(p.country) LIKE ? OR LOWER(p.state) LIKE ?)';
      const searchLocation = `%${location.toLowerCase()}%`;
      queryParams.push(searchLocation, searchLocation, searchLocation);
    }

    // When coordinates are provided, filter by radius and order by distance
    if (lat && lon) {
      query += ` HAVING distance_km <= ?
                ORDER BY distance_km ASC`;
      queryParams.push(parseFloat(radius));
    } else {
      // Default ordering
      query += ' ORDER BY p.created_at DESC';
    }

    console.log('Executing query:', { query, params: queryParams });

    const [properties] = await db.query(query, queryParams);
    console.log(`Found ${properties.length} properties`);

    // Transform the properties
    const formattedProperties = properties.map(property => {
      const rooms = typeof property.rooms === 'string' 
        ? JSON.parse(property.rooms)
        : property.rooms;

      const lowestPrice = rooms?.reduce((min, room) => {
        const price = parseFloat(room.basePrice || room.base_price);
        return price < min ? price : min;
      }, Infinity) || 0;

      return {
        ...property,
        rooms: rooms || [],
        price: lowestPrice,
        is_active: property.is_active === 1,
        distance: property.distance_km ? 
          Math.round(property.distance_km * 10) / 10 : null // Round to 1 decimal
      };
    });

    res.json({
      status: 'success',
      data: formattedProperties
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching properties',
      error: error.message
    });
  }
};

const getPropertyDetailsById = async (req, res) => {
  try {
    console.log('Getting property details for ID:', req.params.id);
    if (!req.params.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Property ID is required'
      });
    }

    const { id } = req.params;
    
    console.log('Fetching property from database...');
    const property = await getProperty(id);
    console.log('Property from database:', property);
    
    if (!property) {
      console.log('Property not found');
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }
    
    console.log('Fetching rooms for property...');
    const rooms = await getRoomsByPropertyId(id);
    console.log('Rooms from database:', rooms);
    
    const response = {
      status: 'success',
      data: {
        ...property,
        rooms
      }
    };
    console.log('Sending response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Error in getPropertyDetailsById:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch property details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createNewProperty = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('Creating property with data:', req.body); // Debug log
    const { photos, rooms, ...propertyData } = req.body;

    // Add created_at and updated_at
    propertyData.created_at = new Date();
    propertyData.updated_at = new Date();
    
    console.log('Property data to insert:', propertyData); // Debug log
    
    // Insert property
    const [result] = await connection.query(
      'INSERT INTO properties SET ?',
      [propertyData]
    );
    
    console.log('Property insert result:', result); // Debug log
    const propertyId = result.insertId;

    // Insert photos if they exist
    if (photos && photos.length > 0) {
      console.log('Photos to insert:', photos); // Debug log
      
      const photoValues = photos.map(photo => [
        propertyId,
        photo.url,
        photo.caption || null
      ]);

      console.log('Photo values to insert:', photoValues); // Debug log

      await connection.query(
        'INSERT INTO property_images (property_id, url, caption) VALUES ?',
        [photoValues]
      );
    }

    // Insert rooms if they exist
    if (rooms && rooms.length > 0) {
      console.log('Rooms to insert:', rooms); // Debug log

      for (const room of rooms) {
        const roomData = {
          property_id: propertyId,
          name: room.name,
          room_type: room.room_type,
          bed_type: room.bed_type,
          beds: room.beds,
          max_occupancy: room.max_occupancy,
          base_price: room.base_price,
          cleaning_fee: room.cleaning_fee,
          service_fee: room.service_fee,
          tax_rate: room.tax_rate,
          security_deposit: room.security_deposit,
          description: room.description,
          bathroom_type: room.bathroom_type,
          view_type: room.view_type,
          has_private_bathroom: room.has_private_bathroom,
          smoking: room.smoking,
          accessibility_features: room.accessibility_features,
          floor_level: room.floor_level,
          has_balcony: room.has_balcony,
          has_kitchen: room.has_kitchen,
          has_minibar: room.has_minibar,
          climate: room.climate,
          price_per_night: room.price_per_night,
          cancellation_policy: room.cancellation_policy,
          includes_breakfast: room.includes_breakfast,
          extra_bed_available: room.extra_bed_available,
          pets_allowed: room.pets_allowed,
          images: room.images,
          cleaning_frequency: room.cleaning_frequency,
          has_toiletries: room.has_toiletries,
          has_towels_linens: room.has_towels_linens,
          has_room_service: room.has_room_service,
          flooring_type: room.flooring_type,
          energy_saving_features: room.energy_saving_features,
          status: room.status || 'available',
          room_size: room.room_size,
          amenities: room.amenities,
          created_at: new Date(),
          updated_at: new Date()
        };

        await connection.query('INSERT INTO rooms SET ?', [roomData]);
      }
    }

    await connection.commit();
    
    // Get the created property with photos and rooms
    const [createdProperty] = await connection.query(
      `SELECT p.*, 
        (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', pi.id, 'url', pi.url, 'caption', pi.caption))
         FROM property_images pi 
         WHERE pi.property_id = p.id) as photos,
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', r.id,
            'name', r.name,
            'room_type', r.room_type,
            'bed_type', r.bed_type,
            'beds', r.beds,
            'max_occupancy', r.max_occupancy,
            'base_price', r.base_price,
            'cleaning_fee', r.cleaning_fee,
            'service_fee', r.service_fee,
            'tax_rate', r.tax_rate,
            'security_deposit', r.security_deposit,
            'description', r.description,
            'bathroom_type', r.bathroom_type,
            'view_type', r.view_type,
            'has_private_bathroom', r.has_private_bathroom,
            'smoking', r.smoking,
            'accessibility_features', r.accessibility_features,
            'floor_level', r.floor_level,
            'has_balcony', r.has_balcony,
            'has_kitchen', r.has_kitchen,
            'has_minibar', r.has_minibar,
            'climate', r.climate,
            'price_per_night', r.price_per_night,
            'cancellation_policy', r.cancellation_policy,
            'includes_breakfast', r.includes_breakfast,
            'extra_bed_available', r.extra_bed_available,
            'pets_allowed', r.pets_allowed,
            'images', r.images,
            'cleaning_frequency', r.cleaning_frequency,
            'has_toiletries', r.has_toiletries,
            'has_towels_linens', r.has_towels_linens,
            'has_room_service', r.has_room_service,
            'flooring_type', r.flooring_type,
            'energy_saving_features', r.energy_saving_features,
            'status', r.status,
            'room_size', r.room_size,
            'amenities', r.amenities
          )
         ) FROM rooms r 
         WHERE r.property_id = p.id) as rooms
       FROM properties p
       WHERE p.id = ?`,
      [propertyId]
    );

    res.status(201).json({
      status: 'success',
      data: createdProperty[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: error.stack // Include stack trace for debugging
    });
  } finally {
    connection.release();
  }
};

const updatePropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('\n[PropertyController] ====== UPDATE PROPERTY START ======');
    console.log('[PropertyController] Property ID:', id);
    console.log('[PropertyController] Request body:', JSON.stringify(req.body, null, 2));
    
    // First check if property exists and get owner info
    const property = await getProperty(id);
    if (!property) {
      console.log('[PropertyController] Property not found');
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.userId !== property.host_id) {
      console.log('[PropertyController] Update authorization failed:', {
        userRole: req.user.role,
        userId: req.user.userId,
        hostId: property.host_id
      });
      return res.status(403).json({ 
        status: 'error',
        message: 'Only administrators and property owners can update this property' 
      });
    }

    // Only update the fields that are provided in the request
    const updateFields = {};
    const allowedFields = ['name', 'description', 'property_type', 'guests', 'bedrooms', 'beds', 'bathrooms', 'star_rating'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    }

    console.log('[PropertyController] Fields to update:', updateFields);

    const updatedProperty = await update(id, updateFields);
    console.log('[PropertyController] Update result:', updatedProperty);
    console.log('[PropertyController] ====== UPDATE PROPERTY END ======\n');

    return res.json({
      status: 'success',
      data: updatedProperty
    });
  } catch (error) {
    console.error('[PropertyController] Error updating property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const deletePropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow admin to delete properties
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error',
        message: 'Only administrators can delete properties' 
      });
    }

    // Check if property exists
    const property = await getProperty(id);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    await deleteProperty(id);
    res.json({
      status: 'success',
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    console.log('Getting all properties. User:', req.user);

    // Default query without user filtering
    let query = `
      SELECT 
        p.*,
        u.email as host_email,
        u.first_name as host_first_name,
        u.last_name as host_last_name,
        (
          SELECT pi.url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          LIMIT 1
        ) as imageUrl,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'type', r.room_type,
              'beds', r.beds,
              'maxOccupancy', r.max_occupancy,
              'basePrice', r.base_price,
              'cleaningFee', r.cleaning_fee,
              'serviceFee', r.service_fee,
              'taxRate', r.tax_rate,
              'securityDeposit', r.security_deposit
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms
      FROM properties p
      LEFT JOIN users u ON p.host_id COLLATE utf8mb4_0900_ai_ci = u.id COLLATE utf8mb4_0900_ai_ci
      WHERE 1=1
    `;

    let queryParams = [];

    // Add user filtering only if user exists and is NOT admin
    if (req.user && req.user.role !== 'admin') {
      query += ' AND p.host_id COLLATE utf8mb4_0900_ai_ci = ? COLLATE utf8mb4_0900_ai_ci';
      queryParams.push(req.user.userId);
    } else {
      // For public view or admin view, only show active properties
      if (!req.user || req.user.role !== 'admin') {
        query += ' AND p.is_active = 1';
      }
    }

    // Add ordering
    query += ' ORDER BY p.created_at DESC';

    console.log('Executing query:', {
      query,
      params: queryParams,
      user: req.user || 'No user'
    });

    const [properties] = await db.query(query, queryParams);
    
    console.log(`Found ${properties.length} properties`);
    
    // Transform the properties to include room data
    const formattedProperties = properties.map(property => {
      // Parse rooms if it's a string, otherwise use as is
      const rooms = typeof property.rooms === 'string' 
        ? JSON.parse(property.rooms)
        : property.rooms;

      // Get the lowest room price
      const lowestPrice = rooms?.reduce((min, room) => {
        const price = parseFloat(room.basePrice || room.base_price);
        return price < min ? price : min;
      }, Infinity) || 0;

      return {
        ...property,
        rooms: rooms || [],
        price: lowestPrice, // Use lowest room price as property price
        is_active: property.is_active === 1 // Ensure boolean value
      };
    });

    res.json({
      status: 'success',
      data: formattedProperties
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching properties',
      details: error.message
    });
  }
};

export const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    console.log('Updating property status:', { id, is_active });

    // First check if property exists and get owner info
    const property = await getProperty(id);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Update the property status
    const [result] = await db.query(
      'UPDATE properties SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Property status updated successfully'
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating property status',
      error: error.message
    });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    // First get the property details
    const [properties] = await db.query(
      `SELECT p.*, 
        u.email as host_email,
        u.first_name as host_first_name,
        u.last_name as host_last_name
       FROM properties p
       LEFT JOIN users u ON p.host_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (properties.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Get property photos
    const [photos] = await db.query(
      'SELECT id, url, caption FROM property_images WHERE property_id = ? ORDER BY id',
      [req.params.id]
    );

    // Get rooms if they exist
    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE property_id = ?',
      [req.params.id]
    );

    // Combine all data
    const propertyData = {
      ...properties[0],
      photos: photos || [],
      rooms: rooms || []
    };

    res.json({
      status: 'success',
      data: propertyData
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const updateProperty = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { photos, ...propertyData } = req.body;
    const propertyId = req.params.id;

    // Update property data
    await connection.query(
      'UPDATE properties SET ? WHERE id = ?',
      [propertyData, propertyId]
    );

    // Handle photos update
    if (photos) {
      // Delete existing photos
      await connection.query(
        'DELETE FROM property_images WHERE property_id = ?',
        [propertyId]
      );

      // Insert new photos
      if (photos.length > 0) {
        const photoValues = photos.map(photo => [
          propertyId,
          photo.url,
          photo.caption || null
        ]);

        await connection.query(
          'INSERT INTO property_images (property_id, url, caption) VALUES ?',
          [photoValues]
        );
      }
    }

    await connection.commit();

    res.json({
      status: 'success',
      message: 'Property updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  } finally {
    connection.release();
  }
};

export { 
  searchProperties, 
  getPropertyDetailsById, 
  updatePropertyById, 
  deletePropertyById,
  createNewProperty
};
