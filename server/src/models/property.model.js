import db from '../db/index.js';
import dayjs from 'dayjs';

const formatTime = (timeStr) => {
  if (!timeStr) return '15:00:00'; // default check-in time
  
  try {
    // If it's an ISO string or date object
    if (timeStr instanceof Date || timeStr.includes('T')) {
      return new Date(timeStr).toTimeString().split(' ')[0];
    }
    
    // If it's already in HH:mm format, add seconds
    if (timeStr.length === 5) {
      return `${timeStr}:00`;
    }
    
    // If it's already in HH:mm:ss format
    if (timeStr.length === 8) {
      return timeStr;
    }
    
    return '15:00:00'; // fallback default
  } catch (error) {
    console.error('Error formatting time:', error);
    return '15:00:00'; // fallback default
  }
};

// Create properties table
const createPropertiesTable = async () => {
  const queries = [
    // Properties table
    `CREATE TABLE IF NOT EXISTS properties (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      street VARCHAR(255),
      city VARCHAR(255) NOT NULL,
      state VARCHAR(255),
      country VARCHAR(255) NOT NULL,
      postal_code VARCHAR(20),
      star_rating DECIMAL(2, 1),
      host_id VARCHAR(36) NOT NULL,
      guests INT NOT NULL,
      bedrooms INT NOT NULL,
      beds INT NOT NULL,
      bathrooms INT NOT NULL,
      property_type ENUM('hotel', 'apartment', 'villa', 'resort', 'guesthouse', 'hostel') NOT NULL,
      languages_spoken JSON,
      check_in_time TIME,
      check_out_time TIME,
      cancellation_policy VARCHAR(50),
      pet_policy VARCHAR(255),
      event_policy VARCHAR(255),
      min_stay INT DEFAULT 1,
      max_stay INT DEFAULT 30,
      house_rules TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users(id)
    )`,

    // Property amenities table with categories
    `CREATE TABLE IF NOT EXISTS property_amenities (
      property_id INT,
      amenity VARCHAR(100),
      category VARCHAR(50) NOT NULL,
      PRIMARY KEY (property_id, amenity, category),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )`,

    // Property images table
    `CREATE TABLE IF NOT EXISTS property_images (
      id INT PRIMARY KEY AUTO_INCREMENT,
      property_id INT,
      url VARCHAR(255) NOT NULL,
      caption VARCHAR(255),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )`,

    // Property rules table
    `CREATE TABLE IF NOT EXISTS property_rules (
      property_id INT,
      rule VARCHAR(255),
      PRIMARY KEY (property_id, rule),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )`,

    // Rooms table
    `CREATE TABLE IF NOT EXISTS rooms (
      id INT PRIMARY KEY AUTO_INCREMENT,
      property_id INT,
      name VARCHAR(255) NOT NULL,
      room_type VARCHAR(50),
      beds JSON,
      max_occupancy INT,
      base_price DECIMAL(10, 2),
      cleaning_fee DECIMAL(10, 2),
      service_fee DECIMAL(10, 2),
      tax_rate DECIMAL(5, 2),
      security_deposit DECIMAL(10, 2),
      description TEXT,
      bathroom_type VARCHAR(50),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )`
  ];

  for (const query of queries) {
    await db.query(query);
  }
};

// Find properties within radius using Haversine formula
const findPropertiesInRadius = async (lat, lon, radius, guests, propertyType) => {
  try {
    console.log('Search parameters:', { lat, lon, radius, guests, propertyType });

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
      LEFT JOIN users u ON p.host_id = u.id COLLATE utf8mb4_0900_ai_ci
      WHERE 
        p.is_active = 1
        AND p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
    `;

    if (guests) {
      query += ' AND p.guests >= ?';
    }

    if (propertyType) {
      query += ' AND p.property_type = ?';
    }

    const queryParams = [];

    if (guests) {
      queryParams.push(parseInt(guests));
    }

    if (propertyType) {
      queryParams.push(propertyType);
    }
      
    console.log('Query:', query);
    console.log('Query params:', queryParams);
    
    const [rows] = await db.query(query, queryParams);
    console.log(`Found ${rows.length} properties:`, rows);
    
    // Filter properties by distance in JavaScript instead of SQL
    const filteredRows = rows.filter(property => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lon),
        parseFloat(property.latitude),
        parseFloat(property.longitude)
      );
      property.distance = distance;
      return distance <= parseFloat(radius);
    });

    console.log(`After distance filter: ${filteredRows.length} properties`);
    
    return filteredRows.map(property => {
      const rooms = typeof property.rooms === 'string' 
        ? JSON.parse(property.rooms)
        : property.rooms;

      return {
        ...property,
        rooms: rooms || [],
        is_active: property.is_active === 1
      };
    });
  } catch (error) {
    console.error('Error in findPropertiesInRadius:', error);
    throw error;
  }
};

// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Get property details including amenities, images, and rules
const getPropertyDetails = async (propertyId) => {
  const queries = {
    property: 'SELECT * FROM properties WHERE id = ?',
    amenities: 'SELECT amenity FROM property_amenities WHERE property_id = ?',
    images: 'SELECT url, caption FROM property_images WHERE property_id = ?',
    rules: 'SELECT rule FROM property_rules WHERE property_id = ?'
  };

  try {
    const [[property]] = await db.query(queries.property, [propertyId]);
    if (!property) return null;

    const [amenities] = await db.query(queries.amenities, [propertyId]);
    const [images] = await db.query(queries.images, [propertyId]);
    const [rules] = await db.query(queries.rules, [propertyId]);

    return {
      ...property,
      amenities: amenities.map(a => a.amenity),
      images,
      rules: rules.map(r => r.rule)
    };
  } catch (error) {
    console.error('Error getting property details:', error);
    throw error;
  }
};

const validPropertyTypes = ['hotel', 'apartment', 'villa', 'resort', 'guesthouse', 'hostel'];

// Add this helper function at the top
const formatTimeString = (timeStr) => {
  if (!timeStr) return null;
  // Convert MySQL TIME format (HH:mm:ss) to HH:mm format
  const match = timeStr.match(/(\d{2}):(\d{2})/);
  if (match) {
    return dayjs().hour(match[1]).minute(match[2]);
  }
  return null;
};

// Get property by id including amenities and images
const getPropertyById = async (id) => {
  const query = `
    WITH RoomDetails AS (
      SELECT r.*, 
             COALESCE(
               (SELECT JSON_ARRAYAGG(amenity)
                FROM (SELECT DISTINCT amenity 
                      FROM room_amenities 
                      WHERE room_id = r.id) t
               ),
               '[]'
             ) as room_amenities
      FROM rooms r
      WHERE r.property_id = ?
    )
    SELECT 
      p.*,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', rd.id,
            'property_id', rd.property_id,
            'name', rd.name,
            'room_type', rd.room_type,
            'beds', rd.beds,
            'max_occupancy', rd.max_occupancy,

            'cleaning_fee', rd.cleaning_fee,
            'service_fee', rd.service_fee,
            'tax_rate', rd.tax_rate,
            'security_deposit', rd.security_deposit,
            'description', rd.description,
            'bathroom_type', rd.bathroom_type,
            'view_type', rd.view_type,
            'has_private_bathroom', rd.has_private_bathroom,
            'smoking', rd.smoking,
            'accessibility_features', rd.accessibility_features,
            'floor_level', rd.floor_level,
            'has_balcony', rd.has_balcony,
            'has_kitchen', rd.has_kitchen,
            'has_minibar', rd.has_minibar,
            'climate', rd.climate,
            'price_per_night', rd.price_per_night,
            'cancellation_policy', rd.cancellation_policy,
            'includes_breakfast', rd.includes_breakfast,
            'extra_bed_available', rd.extra_bed_available,
            'pets_allowed', rd.pets_allowed,
            'images', rd.images,
            'cleaning_frequency', rd.cleaning_frequency,
            'has_toiletries', rd.has_toiletries,
            'has_towels_linens', rd.has_towels_linens,
            'has_room_service', rd.has_room_service,
            'flooring_type', rd.flooring_type,
            'energy_saving_features', rd.energy_saving_features,
            'status', rd.status,
            'room_size', rd.room_size,
            'amenities', COALESCE(rd.room_amenities, '[]'),
            'created_at', rd.created_at,
            'updated_at', rd.updated_at
          )
        ),
        '[]'
      ) as rooms,
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'category', COALESCE(pa.category, 'general'),
              'amenity', pa.amenity
            )
          )
          FROM property_amenities pa
          WHERE pa.property_id = p.id
        ),
        '[]'
      ) as amenities,
      p.house_rules,
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', pi.id,
              'url', pi.url,
              'caption', pi.caption
            )
          )
          FROM property_images pi
          WHERE pi.property_id = p.id
        ),
        '[]'
      ) as photos
    FROM properties p
    LEFT JOIN RoomDetails rd ON p.id = rd.property_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  try {
    const [result] = await db.query(query, [id, id]);
    const property = result[0];
    
    if (!property) return null;

    // Helper function to safely parse JSON or return default
    const safeJSONParse = (data, defaultValue = []) => {
      if (!data) return defaultValue;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('JSON parse error:', e);
        return defaultValue;
      }
    };

    // Parse JSON fields
    property.rooms = safeJSONParse(property.rooms, []);
    property.amenities = safeJSONParse(property.amenities, []);
    property.photos = safeJSONParse(property.photos, []);
    property.languages_spoken = safeJSONParse(property.languages_spoken, []);
    
    // house_rules is stored as TEXT, no need to parse
    property.house_rules = property.house_rules || '';

    return property;
  } catch (error) {
    console.error('Error in getPropertyById:', error);
    throw error;
  }
};

// Create a new property
const createProperty = async (propertyData) => {
  const connection = await db.getConnection();
  
  try {
    // Validate required host_id
    if (!propertyData.host_id) {
      throw new Error('Host ID is required');
    }

    await connection.beginTransaction();
    
    // Insert the main property
    const [propertyResult] = await connection.query(
      `INSERT INTO properties (
        name, description, latitude, longitude, street, city, state, country,
        postal_code, host_id, guests, bedrooms, beds, bathrooms,
        property_type, check_in_time, check_out_time, cancellation_policy,
        pet_policy, event_policy, star_rating, languages_spoken, is_active,
        house_rules, min_stay, max_stay, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        propertyData.name?.trim(),
        propertyData.description?.trim(),
        propertyData.latitude || 0,
        propertyData.longitude || 0,
        propertyData.street?.trim(),
        propertyData.city?.trim(),
        propertyData.state?.trim(),
        propertyData.country?.trim(),
        propertyData.postal_code?.trim(),
        propertyData.host_id,
        parseInt(propertyData.guests) || 1,
        parseInt(propertyData.bedrooms) || 1,
        parseInt(propertyData.beds) || 1,
        parseFloat(propertyData.bathrooms) || 1,
        propertyData.property_type,
        propertyData.check_in_time || '14:00:00',
        propertyData.check_out_time || '11:00:00',
        propertyData.cancellation_policy || 'flexible',
        propertyData.pet_policy?.trim(),
        propertyData.event_policy?.trim(),
        parseInt(propertyData.star_rating) || 0,
        JSON.stringify(Array.isArray(propertyData.languages_spoken) ? propertyData.languages_spoken : []),
        1,
        propertyData.house_rules?.trim(),
        parseInt(propertyData.min_stay) || 1,
        parseInt(propertyData.max_stay) || 30
      ]
    );

    const propertyId = propertyResult.insertId;

    // Insert rooms if they exist
    if (propertyData.rooms && propertyData.rooms.length > 0) {
      const roomInsertQuery = `
        INSERT INTO rooms (
          property_id, name, room_type, bed_type, beds, max_occupancy, 
          cleaning_fee, service_fee, tax_rate, security_deposit,
          description, bathroom_type, view_type, has_private_bathroom,
          smoking, floor_level, has_balcony, has_kitchen, has_minibar, 
          climate, price_per_night, includes_breakfast, extra_bed_available,
          pets_allowed, has_toiletries, has_towels_linens, has_room_service, 
          flooring_type, status, room_size, amenities, created_at, updated_at
        ) VALUES ?
      `;

      const roomValues = propertyData.rooms.map(room => [
        propertyId,
        room.name || '',
        room.room_type || 'standard',
        room.bed_type || 'single',
        room.beds || '[]',
        room.max_occupancy || 2,

        room.cleaning_fee || 0,
        room.service_fee || 0,
        room.tax_rate || 0,
        room.security_deposit || 0,
        room.description || '',
        room.bathroom_type || 'private',
        room.view_type || 'standard',
        room.has_private_bathroom ? 1 : 0,
        room.smoking ? 1 : 0,
        room.floor_level || 1,
        room.has_balcony ? 1 : 0,
        room.has_kitchen ? 1 : 0,
        room.has_minibar ? 1 : 0,
        room.climate || 'ac',
        room.price_per_night || 20.00, // Default minimum price of $20
        room.includes_breakfast ? 1 : 0,
        room.extra_bed_available ? 1 : 0,
        room.pets_allowed ? 1 : 0,
        room.has_toiletries ? 1 : 0,
        room.has_towels_linens ? 1 : 0,
        room.has_room_service ? 1 : 0,
        room.flooring_type || 'carpet',
        room.status || 'available',
        room.room_size || 0,
        room.amenities || '[]',
        new Date(),
        new Date()
      ]);

      if (roomValues.length > 0) {
        console.log('[createProperty] Inserting rooms:', roomValues);
        await connection.query(roomInsertQuery, [roomValues]);
      }
    }

    await connection.commit();
    return { status: 'success', propertyId };
  } catch (error) {
    await connection.rollback();
    console.error('Error in createProperty:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Update a property
const updateProperty = async (propertyId, propertyData) => {
  console.log('[PropertyModel] Starting update with data:', JSON.stringify(propertyData, null, 2));
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('\n[PropertyModel] ====== UPDATE PROPERTY START ======');
    console.log('[PropertyModel] Property ID:', propertyId);
    console.log('[PropertyModel] Raw update data:', JSON.stringify(propertyData, null, 2));

    // Get current property data
    const [rows] = await connection.query(
      'SELECT * FROM properties WHERE id = ?',
      [propertyId]
    );

    if (!rows || rows.length === 0) {
      throw new Error('Property not found');
    }
    
    const currentProperty = rows[0];

    // Format the update data
    const updateData = {};

    // Process each field
    for (const [key, value] of Object.entries(propertyData)) {
      if (value === undefined || value === null) continue;
      
      switch (key) {
        case 'name':
        case 'description':
        case 'house_rules':
        case 'pet_policy':
        case 'event_policy':
        case 'cancellation_policy':
          // Ensure we store string values for text fields
          updateData[key] = typeof value === 'string' ? value.trim() : 
            Array.isArray(value) ? value.join('\n') : String(value || '');
          break;
        case 'guests':
        case 'bedrooms':
        case 'beds':
        case 'min_stay':
        case 'max_stay':
          updateData[key] = parseInt(value) || 0;
          break;
        case 'bathrooms':
        case 'star_rating':
          updateData[key] = parseFloat(value) || 0;
          break;
        case 'check_in_time':
        case 'check_out_time':
          updateData[key] = value ? formatTime(value) : null;
          break;
        default:
          updateData[key] = value;
      }
    }

    console.log('[PropertyModel] Formatted update data:', JSON.stringify(updateData, null, 2));
    
    if (Object.keys(updateData).length === 0) {
      console.log('[PropertyModel] No fields to update');
      throw new Error('No fields to update');
    }

    // Execute the update
    const query = 'UPDATE properties SET ? WHERE id = ?';
    const sqlQuery = connection.format(query, [updateData, propertyId]);
    console.log('[PropertyModel] SQL Query:', sqlQuery);

    const [result] = await connection.query(query, [updateData, propertyId]);
    if (!result.affectedRows) {
      throw new Error('Failed to update property');
    }

    await connection.commit();
    console.log('[PropertyModel] Update successful');
    
    // Return the updated property
    const [updatedProperty] = await connection.query(
      'SELECT * FROM properties WHERE id = ?',
      [propertyId]
    );
    
    return updatedProperty[0];
  } catch (error) {
    await connection.rollback();
    console.error('[PropertyModel] Error updating property:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Helper function to calculate occupancy
const calculateOccupancy = (beds) => {
  const occupancy = {
    'Single Bed': 1,
    'Double Bed': 2,
    'Queen Bed': 2,
    'King Bed': 2,
    'Sofa Bed': 1,
    'Bunk Bed': 2
  };

  return beds.reduce((total, bed) => {
    return total + (occupancy[bed.type] || 0) * (bed.count || 1);
  }, 0);
};

const deleteProperty = async (propertyId) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // First, get all rooms for this property
    const [rooms] = await connection.query('SELECT id FROM rooms WHERE property_id = ?', [propertyId]);
    const roomIds = rooms.map(room => room.id);

    // Check if there are any active bookings for these rooms
    if (roomIds.length > 0) {
      const currentDate = dayjs().format('YYYY-MM-DD');
      const [activeBookings] = await connection.query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE room_id IN (?) 
         AND status != 'cancelled' 
         AND check_out_date >= ?`, 
        [roomIds, currentDate]
      );
      
      const activeBookingsCount = activeBookings[0].count;
      
      if (activeBookingsCount > 0) {
        await connection.rollback();
        throw new Error(`Cannot delete property with active bookings. This property has ${activeBookingsCount} active booking(s).`);
      }
    }

    // Now delete the property (cascade will handle rooms and other related records)
    await connection.query('DELETE FROM properties WHERE id = ?', [propertyId]);
    console.log(`Property ${propertyId} deleted successfully`);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting property:', error);
    
    // Handle MySQL foreign key constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new Error('Cannot delete property because it has active bookings or other dependencies');
    }
    
    throw error;
  } finally {
    connection.release();
  }
};

export {
  createProperty,
  findPropertiesInRadius,
  getPropertyDetails,
  getPropertyById,
  updateProperty,
  deleteProperty,
  createPropertiesTable
};
