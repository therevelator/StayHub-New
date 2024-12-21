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
            'securityDeposit', r.security_deposit,
            'description', r.description
          )
        )
        FROM rooms r
        WHERE r.property_id = p.id
      ) as rooms,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'category', COALESCE(pa.category, 'general'),
            'amenity', pa.amenity
          )
        )
        FROM property_amenities pa
        WHERE pa.property_id = p.id
      ) as amenities,
      (
        SELECT JSON_ARRAYAGG(rule)
        FROM property_rules pr
        WHERE pr.property_id = p.id
      ) as house_rules,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'url', pi.url,
            'caption', pi.caption
          )
        )
        FROM property_images pi
        WHERE pi.property_id = p.id
      ) as images
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

    // Transform amenities array into categories
    const amenitiesByCategory = {
      general: [],
      room: [],
      bathroom: [],
      kitchen: [],
      outdoor: [],
      accessibility: []
    };

    const amenities = safeJSONParse(property.amenities);
    if (Array.isArray(amenities)) {
      amenities.forEach(item => {
        if (item && item.category && item.amenity) {
          if (amenitiesByCategory[item.category]) {
            amenitiesByCategory[item.category].push(item.amenity);
          }
        }
      });
    }

    // Transform room data to match form structure
    const rooms = safeJSONParse(property.rooms).map(room => ({
      name: room.name,
      type: room.type || room.room_type, // Handle both formats
      beds: safeJSONParse(room.beds),
      maxOccupancy: room.maxOccupancy || room.max_occupancy,
      basePrice: room.basePrice || room.base_price,
      cleaningFee: room.cleaningFee || room.cleaning_fee,
      serviceFee: room.serviceFee || room.service_fee,
      taxRate: room.taxRate || room.tax_rate,
      securityDeposit: room.securityDeposit || room.security_deposit,
      description: room.description
    }));

    return {
      basicInfo: {
        name: property.name || '',
        description: property.description || '',
        propertyType: property.property_type || 'hotel',
        guests: property.guests?.toString() || '',
        bedrooms: property.bedrooms?.toString() || '',
        beds: property.beds?.toString() || '',
        bathrooms: property.bathrooms?.toString() || ''
      },
      location: {
        street: property.street || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || '',
        postalCode: property.postal_code || '',
        coordinates: {
          lat: parseFloat(property.latitude) || 0,
          lng: parseFloat(property.longitude) || 0
        }
      },
      amenities: amenitiesByCategory,
      rooms: rooms,
      photos: safeJSONParse(property.images),
      rules: {
        checkInTime: property.check_in_time ? 
          property.check_in_time.slice(0, 5) : // Convert HH:mm:ss to HH:mm
          '14:00',
        checkOutTime: property.check_out_time ? 
          property.check_out_time.slice(0, 5) : // Convert HH:mm:ss to HH:mm
          '11:00',
        cancellationPolicy: property.cancellation_policy || '',
        houseRules: safeJSONParse(property.house_rules),
        petPolicy: property.pet_policy || '',
        eventPolicy: property.event_policy || ''
      }
    };
  } catch (error) {
    console.error('Error in getPropertyById:', error);
    throw error;
  }
};

// Create a new property
const createProperty = async (propertyData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Convert time values before the query
    const checkInTime = propertyData.rules.checkInTime ? 
      new Date(propertyData.rules.checkInTime).toTimeString().split(' ')[0] : 
      '15:00:00';
    
    const checkOutTime = propertyData.rules.checkOutTime ? 
      new Date(propertyData.rules.checkOutTime).toTimeString().split(' ')[0] : 
      '11:00:00';
    
    // Insert the main property
    const [result] = await connection.query(
      `INSERT INTO properties (
        name, description, latitude, longitude, street, city, state, country,
        postal_code, host_id, guests, bedrooms, beds, bathrooms,
        property_type, check_in_time, check_out_time, cancellation_policy,
        pet_policy, event_policy, star_rating, languages_spoken, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        propertyData.basicInfo.name,
        propertyData.basicInfo.description,
        propertyData.location.coordinates.lat,
        propertyData.location.coordinates.lng,
        propertyData.location.street,
        propertyData.location.city,
        propertyData.location.state,
        propertyData.location.country,
        propertyData.location.postalCode,
        propertyData.host_id,
        parseInt(propertyData.basicInfo.guests) || 1,
        parseInt(propertyData.basicInfo.bedrooms) || 1,
        parseInt(propertyData.basicInfo.beds) || 1,
        parseInt(propertyData.basicInfo.bathrooms) || 1,
        propertyData.basicInfo.propertyType,
        checkInTime,
        checkOutTime,
        propertyData.rules.cancellationPolicy,
        propertyData.rules.petPolicy,
        propertyData.rules.eventPolicy,
        propertyData.basicInfo.starRating || null,
        propertyData.basicInfo.languagesSpoken || null,
        propertyData.rules.isActive ? 1 : 0
      ]
    );

    const propertyId = result.insertId;

    // Insert rooms
    if (propertyData.rooms?.length > 0) {
      const roomValues = propertyData.rooms.map(room => [
        propertyId,
        room.name,
        room.type,
        JSON.stringify(room.beds),
        calculateOccupancy(room.beds),
        parseFloat(room.basePrice) || 0,
        parseFloat(room.cleaningFee) || null,
        parseFloat(room.serviceFee) || null,
        parseFloat(room.taxRate) || null,
        parseFloat(room.securityDeposit) || null,
        room.description,
        room.bathroom_type || 'private'
      ]);

      await connection.query(
        `INSERT INTO rooms 
        (property_id, name, room_type, beds, max_occupancy, base_price, cleaning_fee, service_fee, tax_rate, security_deposit, description, bathroom_type) 
        VALUES ?`,
        [roomValues]
      );
    }

    // Handle amenities with duplicate prevention
    if (propertyData.amenities) {
      const processedAmenities = new Set();
      const amenityValues = [];

      Object.entries(propertyData.amenities).forEach(([category, amenities]) => {
        // Remove duplicates within each category
        const uniqueAmenities = [...new Set(amenities)];
        
        uniqueAmenities.forEach(amenity => {
          const amenityKey = `${propertyId}-${category}-${amenity}`;
          
          if (!processedAmenities.has(amenityKey)) {
            processedAmenities.add(amenityKey);
            amenityValues.push([
              propertyId,
              amenity,
              category
            ]);
          }
        });
      });

      if (amenityValues.length > 0) {
        await connection.query(
          `INSERT INTO property_amenities (property_id, amenity, category) 
           VALUES ?`,
          [amenityValues]
        );
      }
    }

    // Insert house rules
    if (propertyData.rules.houseRules?.length > 0) {
      const ruleValues = propertyData.rules.houseRules.map(rule => [propertyId, rule]);
      await connection.query(
        'INSERT INTO property_rules (property_id, rule) VALUES ?',
        [ruleValues]
      );
    }

    // Insert images
    if (propertyData.photos?.length > 0) {
      const imageValues = propertyData.photos.map(photo => [
        propertyId,
        photo.url,
        photo.caption || null
      ]);
      await connection.query(
        'INSERT INTO property_images (property_id, url, caption) VALUES ?',
        [imageValues]
      );
    }

    await connection.commit();
    return {
      id: propertyId,
      ...propertyData,
      created_at: new Date(),
      updated_at: new Date()
    };

  } catch (error) {
    console.error('Error in createProperty:', error);
    await connection.rollback();
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

    // Format time values
    const formatTime = (timeString, type) => {
      if (!timeString || timeString === 'Invalid') {
        // Default to 2 PM for check-in, 11 AM for check-out
        return type === 'check_in_time' ? '14:00:00' : '11:00:00';
      }

      // If time is in HH:mm format, append :00 for MySQL TIME format
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return `${timeString}:00`;
      }

      try {
        // Handle other formats by parsing them
        const [hours, minutes] = timeString.split(':').map(num => parseInt(num));
        if (!isNaN(hours) && !isNaN(minutes) &&
            hours >= 0 && hours <= 23 &&
            minutes >= 0 && minutes <= 59) {
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        }
        
        // Return default if parsing fails
        return type === 'check_in_time' ? '14:00:00' : '11:00:00';
      } catch (error) {
        console.error('Error formatting time:', error);
        return type === 'check_in_time' ? '14:00:00' : '11:00:00';
      }
    };

    const checkInTime = formatTime(propertyData.rules.checkInTime, 'check_in_time');
    const checkOutTime = formatTime(propertyData.rules.checkOutTime, 'check_out_time');

    console.log('Formatted check-in time:', checkInTime);
    console.log('Formatted check-out time:', checkOutTime);

    // Update basic property information
    const updateQuery = `
      UPDATE properties 
      SET 
        name = ?,
        description = ?,
        property_type = ?,
        guests = ?,
        bedrooms = ?,
        beds = ?,
        bathrooms = ?,
        street = ?,
        city = ?,
        state = ?,
        country = ?,
        postal_code = ?,
        latitude = ?,
        longitude = ?,
        check_in_time = ?,
        check_out_time = ?,
        cancellation_policy = ?,
        pet_policy = ?,
        event_policy = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await connection.query(updateQuery, [
      propertyData.basicInfo.name,
      propertyData.basicInfo.description,
      propertyData.basicInfo.propertyType,
      propertyData.basicInfo.guests,
      propertyData.basicInfo.bedrooms,
      propertyData.basicInfo.beds,
      propertyData.basicInfo.bathrooms,
      propertyData.location.street,
      propertyData.location.city,
      propertyData.location.state,
      propertyData.location.country,
      propertyData.location.postalCode,
      propertyData.location.coordinates.lat,
      propertyData.location.coordinates.lng,
      checkInTime,
      checkOutTime,
      propertyData.rules.cancellationPolicy,
      propertyData.rules.petPolicy,
      propertyData.rules.eventPolicy,
      propertyId
    ]);

    // Handle amenities with duplicate prevention and error reporting
    if (propertyData.amenities) {
      const duplicates = [];
      const processedAmenities = new Set();
      const amenityValues = [];

      Object.entries(propertyData.amenities).forEach(([category, amenities]) => {
        // Remove duplicates within each category
        amenities.forEach(amenity => {
          const amenityKey = `${propertyId}-${category}-${amenity}`;
          
          if (processedAmenities.has(amenityKey)) {
            duplicates.push({ category, amenity });
          } else {
            processedAmenities.add(amenityKey);
            amenityValues.push([propertyId, amenity, category]);
          }
        });
      });

      if (duplicates.length > 0) {
        const duplicateMessages = duplicates.map(d => 
          `"${d.amenity}" is already added in ${d.category}`
        );
        throw new Error(`Duplicate amenities found: ${duplicateMessages.join(', ')}`);
      }

      // Delete existing amenities
      await connection.query(
        'DELETE FROM property_amenities WHERE property_id = ?',
        [propertyId]
      );

      // Insert unique amenities
      if (amenityValues.length > 0) {
        await connection.query(
          `INSERT INTO property_amenities (property_id, amenity, category) 
           VALUES ?`,
          [amenityValues]
        );
      }
    }

    // Handle rooms update if needed
    if (propertyData.rooms) {
      // Your existing room update logic
    }

    // Handle photos update if needed
    if (propertyData.photos) {
      // Your existing photo update logic
    }

    await connection.commit();
    
    // Return updated data with deduplicated amenities
    const updatedAmenities = {};
    Object.entries(propertyData.amenities).forEach(([category, amenities]) => {
      updatedAmenities[category] = [...new Set(amenities)];
    });

    return {
      id: propertyId,
      ...propertyData,
      amenities: updatedAmenities,
      rules: {
        ...propertyData.rules,
        checkInTime,
        checkOutTime
      },
      updated_at: new Date()
    };

  } catch (error) {
    console.error('Error in updateProperty:', error);
    await connection.rollback();
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
