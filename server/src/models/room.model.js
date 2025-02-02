import db from '../db/index.js';

// Helper function to safely handle JSON fields
const safeJsonStringify = (value, defaultValue) => {
  console.log(`[RoomModel] Processing field with value:`, value);
  if (value === undefined || value === null) {
    console.log('[RoomModel] Using default value:', defaultValue);
    return JSON.stringify(defaultValue);
  }
  try {
    if (typeof value === 'string') {
      // Validate it's proper JSON by parsing
      const parsed = JSON.parse(value);
      console.log('[RoomModel] Already valid JSON string:', parsed);
      return value;
    }
    // If it's an array or object, stringify it
    const stringified = JSON.stringify(value);
    console.log('[RoomModel] Stringified value:', stringified);
    return stringified;
  } catch (e) {
    console.error('[RoomModel] Error processing JSON:', e);
    console.log('[RoomModel] Using default value after error:', defaultValue);
    return JSON.stringify(defaultValue);
  }
};

// Helper function to safely parse JSON
const safeJsonParse = (str, defaultValue) => {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON:', e, 'for string:', str);
    return defaultValue;
  }
};

// Helper function to generate room description
const generateRoomDescription = (roomData) => {
  const type = roomData.type || 'Standard';
  let bedsDescription = '';
  
  if (Array.isArray(roomData.beds) && roomData.beds.length > 0) {
    bedsDescription = ' with ' + roomData.beds
      .map(b => `${b.count} ${b.type}`)
      .join(' and ');
  }
  
  return `${type} room${bedsDescription}`;
};

// Define valid room types - must match exactly with the database values
const VALID_ROOM_TYPES = [
  'single room',
  'double room',
  'triple room',
  'quadruple room',
  'multi room',
  'apartment',
  'penthouse',
  'studio apartment',
  'deluxe suite',
  'executive suite',
  'family room',
  'connecting rooms',
  'accessible room',
  'presidential suite',
  'other'
];

// Add descriptions for each room type
const ROOM_TYPE_DESCRIPTIONS = {
  'single room': 'Cozy room designed for one person',
  'double room': 'Comfortable room suitable for two people',
  'triple room': 'Spacious room that accommodates three people',
  'quadruple room': 'Large room designed for four people',
  'multi room': 'Flexible space that can accommodate multiple guests',
  'apartment': 'Full apartment with kitchen and living spaces',
  'penthouse': 'Luxury top-floor accommodation with premium amenities',
  'studio apartment': 'Compact apartment with combined living and sleeping area',
  'deluxe suite': 'Premium suite with enhanced comfort and amenities',
  'executive suite': 'Upscale suite with separate living area and premium features',
  'family room': 'Spacious room designed for families',
  'connecting rooms': 'Adjacent rooms with connecting door',
  'accessible room': 'Room designed for accessibility needs',
  'presidential suite': 'Most luxurious suite with exceptional amenities',
  'other': 'Custom room type'
};

// Define valid bathroom types
const VALID_BATHROOM_TYPES = ['private', 'shared', 'en-suite', 'jack-and-jill', 'split'];

export const createRoom = async (propertyId, roomData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Map frontend room data to database schema
    const roomDataForDb = {
      property_id: propertyId,
      name: roomData.name || `${roomData.room_type || 'Standard'} Room`,
      room_type: roomData.room_type?.toLowerCase() || 'standard',
      bathroom_type: roomData.bathroom_type?.toLowerCase() || 'private',
      beds: Array.isArray(roomData.beds) ? JSON.stringify(roomData.beds) : JSON.stringify([]),
      room_size: roomData.room_size || 0,
      max_occupancy: roomData.max_occupancy || 2,
      base_price: roomData.base_price || 0,
      price_per_night: roomData.price_per_night || roomData.base_price || 0,
      view_type: roomData.view_type?.toLowerCase() || 'standard',
      has_private_bathroom: roomData.bathroom_type?.toLowerCase() === 'private',
      amenities: Array.isArray(roomData.amenities) ? JSON.stringify(roomData.amenities) : JSON.stringify([]),
      smoking: roomData.smoking || false,
      accessibility_features: JSON.stringify([]),
      floor_level: roomData.floor_level || 1,
      has_balcony: roomData.has_balcony || false,
      has_kitchen: roomData.has_kitchen || false,
      has_minibar: roomData.has_minibar || false,
      climate: JSON.stringify({ type: 'ac', available: true }),
      cancellation_policy: roomData.cancellation_policy || 'flexible',
      includes_breakfast: roomData.includes_breakfast || false,
      extra_bed_available: roomData.extra_bed_available || false,
      pets_allowed: roomData.pets_allowed || false,
      images: JSON.stringify([]),
      cleaning_frequency: roomData.cleaning_frequency || 'daily',
      description: generateRoomDescription(roomData),
      has_toiletries: true,
      has_towels_linens: true,
      has_room_service: false,
      flooring_type: 'carpet',
      energy_saving_features: JSON.stringify([]),
      status: 'available',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Create multiple room entries if quantity > 1
    const quantity = roomData.quantity || 1;
    let firstRoomId = null;

    for (let i = 0; i < quantity; i++) {
      const roomName = quantity > 1 ? `${roomDataForDb.name} #${i + 1}` : roomDataForDb.name;
      const [result] = await connection.query(
        'INSERT INTO rooms SET ?',
        [{ ...roomDataForDb, name: roomName }]
      );
      
      if (i === 0) {
        firstRoomId = result.insertId;
      }
    }

    await connection.commit();

    // Get the first created room with parsed JSON fields
    const [rows] = await connection.query(
      'SELECT * FROM rooms WHERE id = ?',
      [firstRoomId]
    );

    if (!rows[0]) {
      throw new Error('Room was created but could not be retrieved');
    }

    const createdRoom = rows[0];
    console.log('Raw room data:', createdRoom);

    // Parse JSON fields in the response

    // Parse JSON fields in the response
    const formattedRoom = {
      ...createdRoom,
      beds: safeJsonParse(createdRoom.beds, []),
      amenities: safeJsonParse(createdRoom.amenities, []),
      accessibility_features: safeJsonParse(createdRoom.accessibility_features, []),
      climate: safeJsonParse(createdRoom.climate, null),
      images: safeJsonParse(createdRoom.images, []),
      energy_saving_features: safeJsonParse(createdRoom.energy_saving_features, [])
    };

    return formattedRoom;

  } catch (error) {
    console.error('Error creating room:', error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getRoomsByPropertyId = async (propertyId) => {
  const query = `
    SELECT 
      r.*,
      CAST(r.beds AS JSON) as beds_json,
      CAST(JSON_ARRAY(
        IF(r.has_private_bathroom = 1, 'Private Bathroom', NULL),
        IF(r.has_balcony = 1, 'Balcony', NULL),
        IF(r.has_kitchen = 1, 'Kitchen', NULL),
        IF(r.has_minibar = 1, 'Mini Bar', NULL),
        IF(r.has_toiletries = 1, 'Toiletries', NULL),
        IF(r.has_towels_linens = 1, 'Towels & Linens', NULL),
        IF(r.has_room_service = 1, 'Room Service', NULL)
      ) AS JSON) as room_amenities
    FROM rooms r
    WHERE r.property_id = ? 
    ORDER BY r.created_at ASC
  `;
  
  try {
    const [rows] = await db.query(query, [propertyId]);
    return rows.map(row => ({
      ...row,
      beds: row.beds_json || JSON.parse(row.beds || '[]'),
      amenities: typeof row.room_amenities === 'string' ? 
        JSON.parse(row.room_amenities).filter(amenity => amenity !== null) :
        (Array.isArray(row.room_amenities) ? row.room_amenities.filter(amenity => amenity !== null) : [])
    }));
  } catch (error) {
    console.error('Error getting rooms:', error);
    throw error;
  }
};

export const updateRoom = async (roomId, roomData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // First check if room exists and belongs to property
    const [rooms] = await connection.query(
      'SELECT id FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, roomData.property_id]
    );

    if (rooms.length === 0) {
      throw new Error('Room not found or does not belong to this property');
    }

    console.log('[RoomModel] Received room data:', roomData);

    // Helper function to safely handle JSON fields
    const safeJsonStringify = (value, defaultValue) => {
      if (value === undefined || value === null) return JSON.stringify(defaultValue);
      try {
        if (typeof value === 'string') {
          // Validate it's proper JSON by parsing
          JSON.parse(value);
          return value;
        }
        return JSON.stringify(value);
      } catch (e) {
        console.error('Error processing JSON field:', e);
        return JSON.stringify(defaultValue);
      }
    };

    // Process JSON fields first
    roomData.beds = safeJsonStringify(roomData.beds, []);
    roomData.amenities = safeJsonStringify(roomData.amenities, []);
    roomData.accessibility_features = safeJsonStringify(roomData.accessibility_features, []);
    roomData.energy_saving_features = safeJsonStringify(roomData.energy_saving_features, []);
    roomData.images = safeJsonStringify(roomData.images, []);
    roomData.climate = safeJsonStringify(roomData.climate, { type: 'ac', available: true });

    console.log('[RoomModel] Processed JSON fields:', {
      beds: roomData.beds,
      amenities: roomData.amenities,
      climate: roomData.climate
    });

    // Validate required fields
    const requiredFields = ['name', 'room_type', 'price_per_night', 'max_occupancy'];
    for (const field of requiredFields) {
      if (!roomData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure numeric fields are valid numbers
    const numericFields = ['price_per_night', 'base_price', 'room_size', 'floor_level', 'max_occupancy'];
    for (const field of numericFields) {
      if (roomData[field] !== undefined) {
        const value = Number(roomData[field]);
        if (isNaN(value)) {
          throw new Error(`Invalid numeric value for ${field}`);
        }
        roomData[field] = value;
      }
    }

    // Ensure boolean fields are 0 or 1
    const booleanFields = [
      'has_private_bathroom', 'smoking', 'has_balcony', 'has_kitchen',
      'has_minibar', 'includes_breakfast', 'extra_bed_available',
      'pets_allowed', 'has_toiletries', 'has_towels_linens', 'has_room_service'
    ];
    for (const field of booleanFields) {
      if (roomData[field] !== undefined) {
        roomData[field] = roomData[field] ? 1 : 0;
      }
    }

    // Ensure JSON fields are valid JSON strings
    // Process JSON fields

    // Process JSON fields with appropriate defaults
    roomData.beds = safeJsonStringify(roomData.beds, [{ type: 'Single Bed', count: 1 }]);
    roomData.amenities = safeJsonStringify(roomData.amenities, []);
    roomData.accessibility_features = safeJsonStringify(roomData.accessibility_features, []);
    roomData.energy_saving_features = safeJsonStringify(roomData.energy_saving_features, []);
    roomData.images = safeJsonStringify(roomData.images, []);
    roomData.climate = safeJsonStringify(roomData.climate, { type: 'ac', available: true });

    console.log('[RoomModel] Processed JSON fields:', {
      beds: roomData.beds,
      amenities: roomData.amenities
    });

    // Map frontend room data to database schema
    const roomDataForDb = {
      name: roomData.name,
      room_type: roomData.room_type,
      bathroom_type: roomData.bathroom_type,
      beds: roomData.beds,
      room_size: roomData.room_size,
      max_occupancy: roomData.max_occupancy,
      base_price: roomData.base_price,
      price_per_night: roomData.price_per_night,
      view_type: roomData.view_type,
      has_private_bathroom: roomData.has_private_bathroom,
      amenities: roomData.amenities,
      smoking: roomData.smoking,
      accessibility_features: roomData.accessibility_features,
      floor_level: roomData.floor_level,
      has_balcony: roomData.has_balcony,
      has_kitchen: roomData.has_kitchen,
      has_minibar: roomData.has_minibar,
      climate: roomData.climate,
      cancellation_policy: roomData.cancellation_policy || 'flexible',
      includes_breakfast: roomData.includes_breakfast,
      extra_bed_available: roomData.extra_bed_available,
      pets_allowed: roomData.pets_allowed,
      images: roomData.images,
      cleaning_frequency: roomData.cleaning_frequency || 'daily',
      description: roomData.description,
      has_toiletries: roomData.has_toiletries,
      has_towels_linens: roomData.has_towels_linens,
      has_room_service: roomData.has_room_service,
      flooring_type: roomData.flooring_type || 'carpet',
      energy_saving_features: roomData.energy_saving_features,
      status: roomData.status || 'available',
      updated_at: new Date()
    };

    console.log('Room data before update:', roomDataForDb);

    const [result] = await connection.query(
      'UPDATE rooms SET ? WHERE id = ?',
      [roomDataForDb, roomId]
    );

    await connection.commit();

    // Get the updated room with parsed JSON fields
    const [updatedRoom] = await connection.query(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );

    if (!updatedRoom[0]) {
      throw new Error('Room was updated but could not be retrieved');
    }

    // Safe JSON parsing function
    const safeParseJson = (str, defaultValue) => {
      if (!str) return defaultValue;
      try {
        return JSON.parse(str);
      } catch (e) {
        console.warn(`[RoomModel] Failed to parse JSON:`, e);
        return defaultValue;
      }
    };

    // Parse JSON fields in the response
    const formattedRoom = {
      ...updatedRoom[0],
      beds: safeParseJson(updatedRoom[0].beds, [{ type: 'Single Bed', count: 1 }]),
      amenities: safeParseJson(updatedRoom[0].amenities, []),
      accessibility_features: safeParseJson(updatedRoom[0].accessibility_features, []),
      climate: safeParseJson(updatedRoom[0].climate, { type: 'ac', available: true }),
      images: safeParseJson(updatedRoom[0].images, []),
      energy_saving_features: safeParseJson(updatedRoom[0].energy_saving_features, [])
    };

    return formattedRoom;

  } catch (error) {
    console.error('Error updating room:', error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteRoom = async (roomId) => {
  const query = 'DELETE FROM rooms WHERE id = ?';
  
  try {
    const [result] = await db.query(query, [roomId]);
    if (result.affectedRows === 0) {
      throw new Error('Room not found');
    }
    return true;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};
