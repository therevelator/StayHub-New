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
    SELECT 
      p.*,
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'room_type', r.room_type,
              'beds', COALESCE(r.beds, '[]'),
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
              'accessibility_features', COALESCE(r.accessibility_features, '[]'),
              'floor_level', r.floor_level,
              'has_balcony', r.has_balcony,
              'has_kitchen', r.has_kitchen,
              'has_minibar', r.has_minibar,
              'climate', COALESCE(r.climate, 'null'),
              'price_per_night', r.price_per_night,
              'cancellation_policy', r.cancellation_policy,
              'includes_breakfast', r.includes_breakfast,
              'extra_bed_available', r.extra_bed_available,
              'pets_allowed', r.pets_allowed,
              'images', COALESCE(r.images, '[]'),
              'cleaning_frequency', r.cleaning_frequency,
              'has_toiletries', r.has_toiletries,
              'has_towels_linens', r.has_towels_linens,
              'has_room_service', r.has_room_service,
              'flooring_type', r.flooring_type,
              'energy_saving_features', COALESCE(r.energy_saving_features, '[]'),
              'status', r.status,
              'room_size', r.room_size,
              'amenities', COALESCE(r.amenities, '[]')
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
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
      COALESCE(
        (
          SELECT JSON_ARRAYAGG(rule)
          FROM property_rules pr
          WHERE pr.property_id = p.id
        ),
        '[]'
      ) as house_rules,
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
    WHERE p.id = ?
  `;

  try {
    const [result] = await db.query(query, [id]);
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
    property.house_rules = safeJSONParse(property.house_rules, []);
    property.photos = safeJSONParse(property.photos, []);
    property.languages_spoken = safeJSONParse(property.languages_spoken, []);

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
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        propertyData.name,
        propertyData.description,
        propertyData.latitude || 0,
        propertyData.longitude || 0,
        propertyData.street,
        propertyData.city,
        propertyData.state,
        propertyData.country,
        propertyData.postal_code,
        propertyData.host_id, // This should now be guaranteed to exist
        propertyData.guests || 1,
        propertyData.bedrooms || 1,
        propertyData.beds || 1,
        propertyData.bathrooms || 1,
        propertyData.property_type,
        propertyData.check_in_time || '14:00:00',
        propertyData.check_out_time || '11:00:00',
        propertyData.cancellation_policy || 'flexible',
        propertyData.pet_policy || '',
        propertyData.event_policy || '',
        propertyData.star_rating || 0,
        JSON.stringify(propertyData.languages_spoken || []),
        propertyData.is_active ? 1 : 0
      ]
    );

    const propertyId = propertyResult.insertId;

    // Insert rooms if they exist
    if (propertyData.rooms && propertyData.rooms.length > 0) {
      const roomInsertQuery = `
        INSERT INTO rooms (
          property_id, name, room_type, bed_type, beds, max_occupancy, 
          base_price, cleaning_fee, service_fee, tax_rate, security_deposit,
          description, bathroom_type, view_type, has_private_bathroom,
          smoking, accessibility_features, floor_level, has_balcony,
          has_kitchen, has_minibar, climate, price_per_night,
          cancellation_policy, includes_breakfast, extra_bed_available,
          pets_allowed, images, cleaning_frequency, has_toiletries,
          has_towels_linens, has_room_service, flooring_type,
          energy_saving_features, status, room_size, amenities,
          created_at, updated_at
        ) VALUES ?
      `;

      const roomValues = propertyData.rooms.map(room => [
        propertyId,
        room.name,
        room.room_type,
        room.bed_type,
        room.beds,
        room.max_occupancy,
        room.base_price,
        room.cleaning_fee,
        room.service_fee,
        room.tax_rate,
        room.security_deposit,
        room.description,
        room.bathroom_type,
        room.view_type,
        room.has_private_bathroom,
        room.smoking,
        room.accessibility_features,
        room.floor_level,
        room.has_balcony,
        room.has_kitchen,
        room.has_minibar,
        room.climate,
        room.price_per_night,
        room.cancellation_policy,
        room.includes_breakfast,
        room.extra_bed_available,
        room.pets_allowed,
        room.images,
        room.cleaning_frequency,
        room.has_toiletries,
        room.has_towels_linens,
        room.has_room_service,
        room.flooring_type,
        room.energy_saving_features,
        room.status,
        room.room_size,
        room.amenities,
        new Date(),
        new Date()
      ]);

      if (roomValues.length > 0) {
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
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    console.log('\n[PropertyModel] ====== UPDATE PROPERTY START ======');
    console.log('[PropertyModel] Property ID:', propertyId);
    console.log('[PropertyModel] Raw update data:', JSON.stringify(propertyData, null, 2));

    // Get current property data
    const [currentProperty] = await connection.query(
      'SELECT * FROM properties WHERE id = ?',
      [propertyId]
    );

    if (!currentProperty || currentProperty.length === 0) {
      throw new Error('Property not found');
    }

    // Only update the fields that are provided in the request
    const updateData = {};
    if (propertyData.name !== undefined) updateData.name = propertyData.name.trim();
    if (propertyData.description !== undefined) updateData.description = propertyData.description.trim();
    if (propertyData.property_type !== undefined) updateData.property_type = propertyData.property_type;
    if (propertyData.guests !== undefined) updateData.guests = parseInt(propertyData.guests);
    if (propertyData.bedrooms !== undefined) updateData.bedrooms = parseInt(propertyData.bedrooms);
    if (propertyData.beds !== undefined) updateData.beds = parseInt(propertyData.beds);
    if (propertyData.bathrooms !== undefined) updateData.bathrooms = parseFloat(propertyData.bathrooms);
    if (propertyData.star_rating !== undefined) updateData.star_rating = parseFloat(propertyData.star_rating);

    console.log('[PropertyModel] Formatted update data:', JSON.stringify(updateData, null, 2));
    
    if (Object.keys(updateData).length === 0) {
      console.log('[PropertyModel] No fields to update');
      return { status: 'success', message: 'No fields to update' };
    }

    // Generate and log the SQL query
    const query = 'UPDATE properties SET ? WHERE id = ?';
    const sqlQuery = connection.format(query, [updateData, propertyId]);
    console.log('[PropertyModel] SQL Query:', sqlQuery);
    
    const [result] = await connection.query(query, [updateData, propertyId]);
    console.log('[PropertyModel] Update result:', result);
    console.log('[PropertyModel] ====== UPDATE PROPERTY END ======\n');

    await connection.commit();
    
    return {
      status: 'success',
      message: 'Property updated successfully',
      affectedRows: result.affectedRows
    };
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

    // Delete related records (cascade will handle this automatically)
    await connection.query('DELETE FROM properties WHERE id = ?', [propertyId]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting property:', error);
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
