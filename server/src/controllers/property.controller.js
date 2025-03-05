import { findPropertiesInRadius, getPropertyDetails, getPropertyById as getProperty, updateProperty as update, deleteProperty } from '../models/property.model.js';
import { createRoom as createRoomModel, getRoomsByPropertyId } from '../models/room.model.js';
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

    // Debug query to check available properties without distance filter
    const basicQuery = `
      SELECT id, guests, property_type, city, country, latitude, longitude
      FROM properties p
      WHERE is_active = 1 
      AND guests >= ?
    `;
    const [basicProperties] = await db.query(basicQuery, [parseInt(guests)]);
    console.log('Properties before distance filter:', basicProperties);

    // Debug distance calculations
    const distanceQuery = `
      SELECT 
        id, 
        guests, 
        property_type, 
        city, 
        country,
        latitude,
        longitude,
        ST_Distance_Sphere(
          point(longitude, latitude),
          point(?, ?)
        ) * 0.001 as distance_km
      FROM properties
      WHERE is_active = 1 
      AND guests >= ?
      ORDER BY distance_km ASC
    `;
    const [propertiesWithDistance] = await db.query(distanceQuery, [
      parseFloat(lon), 
      parseFloat(lat), 
      parseInt(guests)
    ]);
    console.log('Properties with distances:', propertiesWithDistance);

    // Main search query
    let query = `
      WITH RoomBeds AS (
        SELECT DISTINCT
          r.property_id,
          LOWER(REPLACE(REPLACE(REPLACE(bed.type, ' ', ''), '&', ''), '-', '')) as bed_name
        FROM rooms r
        CROSS JOIN JSON_TABLE(
          COALESCE(r.beds, '[]'),
          '$[*]' COLUMNS (
            type VARCHAR(255) PATH '$.type'
          )
        ) bed
        WHERE bed.type IS NOT NULL
      ),
      AggregatedBeds AS (
        SELECT 
          property_id,
          JSON_ARRAYAGG(bed_name) as room_beds
        FROM RoomBeds
        GROUP BY property_id
      ),
      PropertyAmenities AS (
        SELECT DISTINCT
          property_id,
          LOWER(REPLACE(REPLACE(REPLACE(amenity, ' ', ''), '&', ''), '-', '')) as amenity_name
        FROM property_amenities
      ),
      RoomAmenities AS (
        SELECT DISTINCT
          property_id,
          amenity_name
        FROM (
          -- Room boolean fields as amenities
          SELECT property_id, 'roomservice' as amenity_name FROM rooms WHERE has_room_service = 1
          UNION
          SELECT property_id, 'privatebathroom' FROM rooms WHERE has_private_bathroom = 1
          UNION
          SELECT property_id, 'balcony' FROM rooms WHERE has_balcony = 1
          UNION
          SELECT property_id, 'kitchen' FROM rooms WHERE has_kitchen = 1
          UNION
          SELECT property_id, 'minibar' FROM rooms WHERE has_minibar = 1
          UNION
          SELECT property_id, 'breakfastincluded' FROM rooms WHERE includes_breakfast = 1
          UNION
          SELECT property_id, 'extrabedavailable' FROM rooms WHERE extra_bed_available = 1
          UNION
          SELECT property_id, 'petsallowed' FROM rooms WHERE pets_allowed = 1
          UNION
          SELECT property_id, 'toiletries' FROM rooms WHERE has_toiletries = 1
          UNION
          SELECT property_id, 'towelslinens' FROM rooms WHERE has_towels_linens = 1
          UNION
          SELECT property_id, 'smokingallowed' FROM rooms WHERE smoking = 1
          UNION
          -- Room amenities array
          SELECT 
            r.property_id,
            LOWER(REPLACE(REPLACE(REPLACE(a.amenity, ' ', ''), '&', ''), '-', '')) as amenity_name
          FROM rooms r
          JOIN JSON_TABLE(
            COALESCE(r.amenities, '[]'),
            '$[*]' COLUMNS (amenity VARCHAR(255) PATH '$')
          ) a
        ) room_amenities
      ),
      CombinedAmenities AS (
        SELECT property_id, amenity_name FROM PropertyAmenities
        UNION
        SELECT property_id, amenity_name FROM RoomAmenities
      ),
      AggregatedAmenities AS (
        SELECT 
          property_id,
          JSON_ARRAYAGG(amenity_name) as room_amenities
        FROM CombinedAmenities
        GROUP BY property_id
      )
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
              'price_per_night', r.price_per_night,
              'cleaningFee', r.cleaning_fee,
              'serviceFee', r.service_fee,
              'taxRate', r.tax_rate,
              'securityDeposit', r.security_deposit
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms,
        (
          SELECT COALESCE(SUM(r.max_occupancy), 0)
          FROM rooms r
          WHERE r.property_id = p.id
        ) as total_max_occupancy,
        (
          SELECT JSON_ARRAYAGG(amenity)
          FROM property_amenities
          WHERE property_id = p.id
        ) as property_amenities,
        (
          SELECT JSON_ARRAYAGG(
            LOWER(REPLACE(REPLACE(REPLACE(amenity, ' ', ''), '&', ''), '-', ''))
          )
          FROM property_amenities
          WHERE property_id = p.id
        ) as normalized_amenities,
        (
          SELECT room_amenities
          FROM AggregatedAmenities aa
          WHERE aa.property_id = p.id
        ) as room_amenities,
        (
          SELECT room_beds
          FROM AggregatedBeds ab
          WHERE ab.property_id = p.id
        ) as room_beds,
    `;

    // Add distance calculation
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
      query += ' AND (SELECT COALESCE(SUM(r.max_occupancy), 0) FROM rooms r WHERE r.property_id = p.id) >= ?';
      queryParams.push(parseInt(guests));
    }

    if (type) {
      query += ' AND p.property_type = ?';
      queryParams.push(type);
    }

    if (location && location !== 'Current Location') {
      query += ' AND (LOWER(p.city) LIKE ? OR LOWER(p.country) LIKE ? OR LOWER(p.state) LIKE ? OR LOWER(p.name) LIKE ?)';
      const searchLocation = `%${location.toLowerCase()}%`;
      queryParams.push(searchLocation, searchLocation, searchLocation, searchLocation);
    }

    // When coordinates are provided and no name/location search, filter by radius
    if (lat && lon && (!location || location === 'Current Location')) {
      query += ` HAVING distance_km <= ?`;
      queryParams.push(parseFloat(radius));
      query += ` ORDER BY distance_km ASC`;
    } else if (lat && lon) {
      // When searching by name/location with coordinates, order by distance but don't filter
      query += ` ORDER BY distance_km ASC`;
    } else {
      // When no coordinates, order by creation date
      query += ' ORDER BY p.created_at DESC';
    }

    console.log('Final search query:', { query, params: queryParams });

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
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const propertyData = req.body;

  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Extract rooms and images for separate insertion
      const { rooms = [], images = [], ...propertyFields } = propertyData;

      // Insert property
      const [propertyResult] = await connection.query(
        `INSERT INTO properties (
          name, description, latitude, longitude, street, city, state, country,
          postal_code, host_id, guests, bedrooms, beds, bathrooms,
          property_type, check_in_time, check_out_time, cancellation_policy,
          pet_policy, event_policy, star_rating, languages_spoken, is_active,
          house_rules, min_stay, max_stay, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          propertyFields.name?.trim(),
          propertyFields.description?.trim(),
          propertyFields.latitude || 0,
          propertyFields.longitude || 0,
          propertyFields.street?.trim(),
          propertyFields.city?.trim(),
          propertyFields.state?.trim(),
          propertyFields.country?.trim(),
          propertyFields.postal_code?.trim(),
          userId,
          parseInt(propertyFields.guests) || 1,
          parseInt(propertyFields.bedrooms) || 1,
          parseInt(propertyFields.beds) || 1,
          parseFloat(propertyFields.bathrooms) || 1,
          propertyFields.property_type,
          propertyFields.check_in_time || '14:00:00',
          propertyFields.check_out_time || '11:00:00',
          propertyFields.cancellation_policy || 'flexible',
          propertyFields.pet_policy?.trim(),
          propertyFields.event_policy?.trim(),
          parseInt(propertyFields.star_rating) || 0,
          JSON.stringify(Array.isArray(propertyFields.languages_spoken) ? propertyFields.languages_spoken : []),
          1,
          propertyFields.house_rules?.trim(),
          parseInt(propertyFields.min_stay) || 1,
          parseInt(propertyFields.max_stay) || 30
        ]
      );

      const propertyId = propertyResult.insertId;

      // Insert rooms if provided using the room model
      if (rooms.length > 0) {
        for (const room of rooms) {
          await createRoomModel(propertyId, {
            ...room,
            property_id: propertyId,
            room_type: room.room_type || 'standard',
            bathroom_type: room.bathroom_type || 'private',
            beds: room.beds || [],
            room_size: room.room_size || 0,
            max_occupancy: room.max_occupancy || 2,
            view_type: room.view_type || 'standard',
            has_private_bathroom: room.has_private_bathroom || true,
            amenities: room.amenities || [],
            smoking: room.smoking || false,
            accessibility_features: room.accessibility_features || [],
            floor_level: room.floor_level || 1,
            has_balcony: room.has_balcony || false,
            has_kitchen: room.has_kitchen || false,
            has_minibar: room.has_minibar || false,
            climate: room.climate || 'ac',
            price_per_night: room.price_per_night || room.base_price || 0,
            cancellation_policy: room.cancellation_policy || 'flexible',
            includes_breakfast: room.includes_breakfast || false,
            extra_bed_available: room.extra_bed_available || false,
            pets_allowed: room.pets_allowed || false,
            cleaning_frequency: room.cleaning_frequency || 'daily',
            has_toiletries: room.has_toiletries || true,
            has_towels_linens: room.has_towels_linens || true,
            has_room_service: room.has_room_service || false,
            flooring_type: room.flooring_type || 'carpet',
            energy_saving_features: room.energy_saving_features || [],
            status: room.status || 'available',
            created_at: new Date(),
            updated_at: new Date()
          });
        }

        await connection.query(
          `INSERT INTO rooms (
            property_id, name, room_type, bed_type, beds, max_occupancy,
            base_price, cleaning_fee, service_fee, tax_rate, security_deposit,
            description, bathroom_type, view_type, has_private_bathroom,
            smoking, floor_level, has_balcony, has_kitchen, has_minibar,
            climate, price_per_night, includes_breakfast, extra_bed_available,
            pets_allowed, has_toiletries, has_towels_linens, has_room_service,
            flooring_type, status, room_size, amenities, created_at, updated_at
          ) VALUES ?`,
          [roomValues]
        );
      }

      // Insert images if provided
      if (images.length > 0) {
        const imageValues = images.map(image => [
          propertyId,
          image.url,
          image.thumbnail,
          image.delete_url
        ]);

        await connection.query(
          'INSERT INTO property_images (property_id, url, thumbnail_url, delete_url) VALUES ?',
          [imageValues]
        );
      }

      // Commit transaction
      await connection.commit();
      
      res.status(201).json({
        status: 'success',
        data: {
          id: propertyId,
          ...propertyData
        }
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create property'
    });
  }
};

const addPropertyImages = async (req, res) => {
  const { propertyId } = req.params;
  const { images } = req.body;

  try {
    const imageValues = images.map(image => [
      propertyId,
      image.url,
      image.thumbnail,
      image.delete_url
    ]);

    await db.query(
      'INSERT INTO property_images (property_id, url, thumbnail_url, delete_url) VALUES ?',
      [imageValues]
    );

    res.status(200).json({
      status: 'success',
      message: 'Images added successfully'
    });
  } catch (error) {
    console.error('Error adding property images:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add images'
    });
  }
};

const addRoomImages = async (req, res) => {
  const { propertyId, roomId } = req.params;
  const { images } = req.body;

  try {
    const imageValues = images.map(image => [
      roomId,
      image.url,
      image.thumbnail,
      image.delete_url
    ]);

    await db.query(
      'INSERT INTO room_images (room_id, url, thumbnail_url, delete_url) VALUES ?',
      [imageValues]
    );

    res.status(200).json({
      status: 'success',
      message: 'Images added successfully'
    });
  } catch (error) {
    console.error('Error adding room images:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add images'
    });
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
    if (req.user.role !== 'admin' && req.user.id !== property.host_id) {
      console.log('[PropertyController] Update authorization failed:', {
        userRole: req.user.role,
        userId: req.user.id,
        hostId: property.host_id
      });
      return res.status(403).json({ 
        status: 'error',
        message: 'Only administrators and property owners can update this property' 
      });
    }

    // Process update fields
    const updateFields = {};
    
    // Only include fields that are actually provided
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && req.body[key] !== null) {
        updateFields[key] = req.body[key];
      }
    });

    console.log('[PropertyController] Fields to update:', updateFields);

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }

    await update(id, updateFields);
    
    // Fetch the updated property
    const updatedProperty = await getProperty(id);
    console.log('[PropertyController] Updated property:', updatedProperty);
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
    
    // Check if property exists
    const property = await getProperty(id);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }
    
    // Allow property owners to delete their own properties
    if (req.user.role !== 'admin' && property.host_id !== req.user.id) {
      return res.status(403).json({ 
        status: 'error',
        message: 'You can only delete your own properties' 
      });
    }

    await deleteProperty(id);
    res.json({
      status: 'success',
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    
    // Check for specific error messages
    if (error.message && error.message.includes('active bookings')) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        code: 'ACTIVE_BOOKINGS'
      });
    }
    
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
              'price_per_night', r.price_per_night,
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
      queryParams.push(req.user.id);
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
    const { id } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id) as rooms_count,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          JOIN rooms r ON b.room_id = r.id 
          WHERE r.property_id = p.id 
          AND b.status = 'confirmed' 
          AND b.check_out_date >= CURDATE()
        ) as active_bookings_count,
        (
          SELECT COUNT(*)
          FROM maintenance_tasks mt
          WHERE mt.property_id = p.id
          AND mt.status != 'completed'
        ) as maintenance_count,
        (
          SELECT COUNT(*)
          FROM messages m
          JOIN bookings b ON m.booking_id = b.id
          JOIN rooms r ON b.room_id = r.id
          WHERE r.property_id = p.id
          AND m.is_read = FALSE
          AND m.receiver_id = ?
        ) as unread_messages_count,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'room_type', r.room_type,
              'bathroom_type', r.bathroom_type,
              'beds', IF(r.beds IS NULL OR r.beds = '', '[]', r.beds),
              'room_size', r.room_size,
              'max_occupancy', r.max_occupancy,
              'base_price', r.base_price,
              'cleaning_fee', r.cleaning_fee,
              'service_fee', r.service_fee,
              'tax_rate', r.tax_rate,
              'security_deposit', r.security_deposit,
              'description', r.description,
              'view_type', r.view_type,
              'has_private_bathroom', r.has_private_bathroom,
              'amenities', IF(r.amenities IS NULL OR r.amenities = '', '[]', r.amenities),
              'smoking', r.smoking,
              'accessibility_features', IF(r.accessibility_features IS NULL OR r.accessibility_features = '', '[]', r.accessibility_features),
              'floor_level', r.floor_level,
              'has_balcony', r.has_balcony,
              'has_kitchen', r.has_kitchen,
              'has_minibar', r.has_minibar,
              'climate', IF(r.climate IS NULL OR r.climate = '', '{"type":"ac","available":true}', r.climate),
              'price_per_night', r.price_per_night,
              'cancellation_policy', r.cancellation_policy,
              'includes_breakfast', r.includes_breakfast,
              'extra_bed_available', r.extra_bed_available,
              'pets_allowed', r.pets_allowed,
              'images', IF(r.images IS NULL OR r.images = '', '[]', r.images),
              'cleaning_frequency', r.cleaning_frequency,
              'has_toiletries', r.has_toiletries,
              'has_towels_linens', r.has_towels_linens,
              'has_room_service', r.has_room_service,
              'flooring_type', r.flooring_type,
              'energy_saving_features', IF(r.energy_saving_features IS NULL OR r.energy_saving_features = '', '[]', r.energy_saving_features),
              'status', r.status,
              'created_at', r.created_at,
              'updated_at', r.updated_at
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', b.id,
              'guest_name', CONCAT(u.first_name, ' ', u.last_name),
              'check_in_date', DATE_FORMAT(b.check_in_date, '%Y-%m-%d'),
              'check_out_date', DATE_FORMAT(b.check_out_date, '%Y-%m-%d'),
              'status', b.status,
              'room_name', r.name,
              'total_price', b.total_price
            )
          )
          FROM bookings b
          JOIN rooms r ON b.room_id = r.id
          JOIN users u ON b.user_id = u.id
          WHERE r.property_id = p.id
          ORDER BY b.check_in_date DESC
          LIMIT 5
        ) as recent_bookings,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', mt.id,
              'title', mt.title,
              'description', mt.description,
              'priority', mt.priority,
              'status', mt.status,
              'due_date', DATE_FORMAT(mt.due_date, '%Y-%m-%d'),
              'created_at', DATE_FORMAT(mt.created_at, '%Y-%m-%d %H:%i:%s')
            )
          )
          FROM maintenance_tasks mt
          WHERE mt.property_id = p.id
          AND mt.status != 'completed'
          ORDER BY mt.due_date ASC
        ) as maintenance_tasks,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', ft.id,
              'amount', ft.amount,
              'type', ft.type,
              'description', ft.description,
              'status', ft.status,
              'created_at', DATE_FORMAT(ft.created_at, '%Y-%m-%d %H:%i:%s')
            )
          )
          FROM financial_transactions ft
          WHERE ft.property_id = p.id
          ORDER BY ft.created_at DESC
          LIMIT 10
        ) as recent_transactions
      FROM properties p
      WHERE p.id = ? AND p.host_id = ?
    `;

    const [properties] = await db.query(query, [userId, id]);

    if (properties.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Parse JSON strings to objects
    const property = properties[0];
    console.log('Raw rooms from DB:', property.rooms);
    
    if (property.rooms) {
      const parsedRooms = JSON.parse(property.rooms);
      console.log('Parsed rooms:', parsedRooms);
      console.log('First room beds:', parsedRooms[0]?.beds);
    }

    // Format the property data
    const formattedProperty = {
      ...property,
      rooms: [],
      recent_bookings: [],
      maintenance_tasks: [],
      recent_transactions: []
    };

    // Parse rooms if they exist
    if (property.rooms) {
      try {
        const parsedRooms = JSON.parse(property.rooms);
        formattedProperty.rooms = parsedRooms.map(room => ({
          ...room,
          beds: room.beds || [],
          amenities: room.amenities ? JSON.parse(room.amenities) : [],
          accessibility_features: room.accessibility_features ? JSON.parse(room.accessibility_features) : [],
          climate: room.climate ? JSON.parse(room.climate) : { type: 'ac', available: true },
          images: room.images ? JSON.parse(room.images) : [],
          energy_saving_features: room.energy_saving_features ? JSON.parse(room.energy_saving_features) : [],
          has_private_bathroom: !!room.has_private_bathroom,
          smoking: !!room.smoking,
          has_balcony: !!room.has_balcony,
          has_kitchen: !!room.has_kitchen,
          has_minibar: !!room.has_minibar,
          includes_breakfast: !!room.includes_breakfast,
          extra_bed_available: !!room.extra_bed_available,
          pets_allowed: !!room.pets_allowed,
          has_toiletries: !!room.has_toiletries,
          has_towels_linens: !!room.has_towels_linens,
          has_room_service: !!room.has_room_service
        }));
      } catch (e) {
        console.error('Error parsing rooms:', e);
      }
    }

    // Parse other JSON fields
    if (property.recent_bookings) {
      try {
        formattedProperty.recent_bookings = JSON.parse(property.recent_bookings);
      } catch (e) {
        console.error('Error parsing recent_bookings:', e);
      }
    }

    if (property.maintenance_tasks) {
      try {
        formattedProperty.maintenance_tasks = JSON.parse(property.maintenance_tasks);
      } catch (e) {
        console.error('Error parsing maintenance_tasks:', e);
      }
    }

    if (property.recent_transactions) {
      try {
        formattedProperty.recent_transactions = JSON.parse(property.recent_transactions);
      } catch (e) {
        console.error('Error parsing recent_transactions:', e);
      }
    }

    res.json({
      status: 'success',
      data: formattedProperty
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch property details',
      error: error.message
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
          photo.thumbnail,
          photo.delete_url
        ]);

        await connection.query(
          'INSERT INTO property_images (property_id, url, thumbnail_url, delete_url) VALUES ?',
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

// Get property owner's properties with bookings
export const getOwnerProperties = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM rooms r WHERE r.property_id = p.id) as rooms_count,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          JOIN rooms r ON b.room_id = r.id 
          WHERE r.property_id = p.id 
          AND b.status = 'confirmed' 
          AND b.check_out_date >= CURDATE()
        ) as active_bookings_count,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'price_per_night', r.base_price
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', b.id,
              'guest_name', CONCAT(u.first_name, ' ', u.last_name),
              'check_in_date', b.check_in_date,
              'check_out_date', b.check_out_date,
              'status', b.status
            )
          )
          FROM bookings b
          JOIN rooms r ON b.room_id = r.id
          JOIN users u ON b.user_id = u.id
          WHERE r.property_id = p.id
          ORDER BY b.check_in_date DESC
          LIMIT 3
        ) as recent_bookings
      FROM properties p
      WHERE p.host_id = ?
      ORDER BY p.created_at DESC
    `;

    const [properties] = await db.query(query, [userId]);

    // Parse JSON strings to objects, but only if they're strings
    const formattedProperties = properties.map(property => ({
      ...property,
      rooms: property.rooms ? 
        (typeof property.rooms === 'string' ? JSON.parse(property.rooms) : property.rooms) : 
        [],
      recent_bookings: property.recent_bookings ? 
        (typeof property.recent_bookings === 'string' ? JSON.parse(property.recent_bookings) : property.recent_bookings) : 
        []
    }));

    res.json({
      status: 'success',
      data: formattedProperties
    });
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
};

export const getPropertyBookings = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [property] = await db.query(
      'SELECT id FROM properties WHERE id = ? AND host_id = ?',
      [propertyId, userId]
    );

    if (property.length === 0) {
      return res.status(403).json({ message: 'Not authorized to access this property' });
    }

    const [bookings] = await db.query(
      `SELECT b.*, r.name as room_name, 
        u.first_name, u.last_name, u.email,
        p.name as property_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN properties p ON r.property_id = p.id
      JOIN users u ON b.user_id = u.id
      WHERE p.id = ?
      ORDER BY b.check_in_date DESC`,
      [propertyId]
    );

    res.json({
      status: 'success',
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching property bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const [booking] = await db.query(
      `SELECT b.id, p.host_id 
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN properties p ON r.property_id = p.id
      WHERE b.id = ?`,
      [bookingId]
    );

    if (booking.length === 0 || booking[0].host_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    await db.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, bookingId]
    );

    res.json({
      status: 'success',
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};

// Update total max occupancy after room changes
const updatePropertyMaxOccupancy = async (propertyId) => {
  const query = `
    UPDATE properties p
    SET p.guests = (
      SELECT COALESCE(SUM(r.max_occupancy), 0)
      FROM rooms r
      WHERE r.property_id = ?
    )
    WHERE p.id = ?
  `;
  await db.query(query, [propertyId, propertyId]);
};

// Create a new room
const createRoom = async (req, res) => {
  const { propertyId } = req.params;
  const roomData = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO rooms SET ?',
      { ...roomData, property_id: propertyId }
    );

    // Update the property's total max occupancy
    await updatePropertyMaxOccupancy(propertyId);

    res.status(201).json({
      status: 'success',
      data: {
        id: result.insertId,
        ...roomData
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create room'
    });
  }
};

// Update a room
const updateRoom = async (req, res) => {
  const { propertyId, roomId } = req.params;
  const roomData = req.body;

  try {
    await db.query(
      'UPDATE rooms SET ? WHERE id = ? AND property_id = ?',
      [roomData, roomId, propertyId]
    );

    // Update the property's total max occupancy
    await updatePropertyMaxOccupancy(propertyId);

    res.status(200).json({
      status: 'success',
      data: {
        id: roomId,
        ...roomData
      }
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update room'
    });
  }
};

// Delete a room
const deleteRoom = async (req, res) => {
  const { propertyId, roomId } = req.params;

  try {
    // First verify the room belongs to the property
    const [rooms] = await db.query(
      'SELECT id FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, propertyId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found or does not belong to this property'
      });
    }

    // Check for active bookings
    const [bookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND status IN ("pending", "confirmed")',
      [roomId]
    );

    if (bookings[0].count > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete room because it has active bookings. Please cancel or complete all bookings for this room first.',
        code: 'ACTIVE_BOOKINGS'
      });
    }

    // Delete the room
    await db.query('DELETE FROM rooms WHERE id = ?', [roomId]);

    // Update the property's total max occupancy
    await updatePropertyMaxOccupancy(propertyId);

    res.status(200).json({
      status: 'success',
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting the room',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const [booking] = await db.query(
      `SELECT b.*, p.host_id 
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN properties p ON r.property_id = p.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (booking.length === 0 || booking[0].host_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Check if booking is already cancelled
    if (booking[0].status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update a cancelled booking' });
    }

    // Check for overlapping bookings
    const [overlappingBookings] = await db.query(
      `SELECT id FROM bookings 
       WHERE room_id = ? 
       AND id != ?
       AND status IN ('confirmed', 'pending')
       AND (
         (check_in_date < ? AND check_out_date > ?) OR
         (check_in_date <= ? AND check_out_date > ?) OR
         (check_in_date >= ? AND check_out_date <= ?)
       )`,
      [booking[0].room_id, bookingId, checkOutDate, checkInDate, checkOutDate, checkInDate, checkInDate, checkOutDate]
    );

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ message: 'Selected dates overlap with another booking' });
    }

    // Update the booking
    await db.query(
      `UPDATE bookings 
       SET check_in_date = ?,
           check_out_date = ?,
           number_of_guests = ?,
           special_requests = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [checkInDate, checkOutDate, numberOfGuests, specialRequests, bookingId]
    );

    res.json({
      status: 'success',
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [booking] = await db.query(
      `SELECT b.*, p.host_id 
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN properties p ON r.property_id = p.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (booking.length === 0 || booking[0].host_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Check if booking is already cancelled
    if (booking[0].status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Cancel the booking
    await db.query(
      'UPDATE bookings SET status = "cancelled", updated_at = NOW() WHERE id = ?',
      [bookingId]
    );

    res.json({
      status: 'success',
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
};

export { 
  searchProperties, 
  getPropertyDetailsById, 
  updatePropertyById, 
  deletePropertyById,
  createNewProperty,
  createRoom,
  updateRoom,
  deleteRoom,
  addPropertyImages,
  addRoomImages
};
