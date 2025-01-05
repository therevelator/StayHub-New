import db from '../db/index.js';

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

    // Normalize bathroom type
    const normalizedBathroomType = roomData.bathroom_type?.toLowerCase();
    if (!VALID_BATHROOM_TYPES.includes(normalizedBathroomType)) {
      throw new Error(`Invalid bathroom type. Must be one of: ${VALID_BATHROOM_TYPES.join(', ')}`);
    }

    // Ensure all JSON fields are properly stringified
    const roomDataWithStringifiedJson = {
      property_id: propertyId,
      name: roomData.name,
      room_type: roomData.room_type,
      bathroom_type: normalizedBathroomType,
      beds: JSON.stringify(roomData.beds),
      room_size: roomData.room_size,
      max_occupancy: roomData.max_occupancy,
      view_type: roomData.view_type,
      has_private_bathroom: roomData.has_private_bathroom,
      amenities: JSON.stringify(roomData.amenities),
      smoking: roomData.smoking,
      accessibility_features: JSON.stringify(roomData.accessibility_features),
      floor_level: roomData.floor_level,
      has_balcony: roomData.has_balcony,
      has_kitchen: roomData.has_kitchen,
      has_minibar: roomData.has_minibar,
      climate: JSON.stringify(roomData.climate),
      price_per_night: roomData.price_per_night,
      cancellation_policy: roomData.cancellation_policy,
      includes_breakfast: roomData.includes_breakfast,
      extra_bed_available: roomData.extra_bed_available,
      pets_allowed: roomData.pets_allowed,
      images: JSON.stringify(roomData.images),
      cleaning_frequency: roomData.cleaning_frequency,
      description: roomData.description,
      has_toiletries: roomData.has_toiletries,
      has_towels_linens: roomData.has_towels_linens,
      has_room_service: roomData.has_room_service,
      flooring_type: roomData.flooring_type,
      energy_saving_features: JSON.stringify(roomData.energy_saving_features),
      status: roomData.status || 'available',
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('Room data before insert:', roomDataWithStringifiedJson);
    console.log('JSON fields:');
    console.log('beds:', typeof roomDataWithStringifiedJson.beds);
    console.log('amenities:', typeof roomDataWithStringifiedJson.amenities);
    console.log('climate:', typeof roomDataWithStringifiedJson.climate);

    const [result] = await connection.query(
      'INSERT INTO rooms SET ?',
      [roomDataWithStringifiedJson]
    );

    await connection.commit();

    // Get the created room with parsed JSON fields
    const [createdRoom] = await connection.query(
      'SELECT * FROM rooms WHERE id = ?',
      [result.insertId]
    );

    if (!createdRoom[0]) {
      throw new Error('Room was created but could not be retrieved');
    }

    // Parse JSON fields in the response
    const formattedRoom = {
      ...createdRoom[0],
      beds: JSON.parse(createdRoom[0].beds || '[]'),
      amenities: JSON.parse(createdRoom[0].amenities || '[]'),
      accessibility_features: JSON.parse(createdRoom[0].accessibility_features || '[]'),
      climate: JSON.parse(createdRoom[0].climate || 'null'),
      images: JSON.parse(createdRoom[0].images || '[]'),
      energy_saving_features: JSON.parse(createdRoom[0].energy_saving_features || '[]')
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

    // Normalize bathroom type
    const normalizedBathroomType = roomData.bathroom_type?.toLowerCase();
    if (!VALID_BATHROOM_TYPES.includes(normalizedBathroomType)) {
      throw new Error(`Invalid bathroom type. Must be one of: ${VALID_BATHROOM_TYPES.join(', ')}`);
    }

    // First check if room exists and belongs to property
    const [rooms] = await connection.query(
      'SELECT id FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, roomData.property_id]
    );

    if (rooms.length === 0) {
      throw new Error('Room not found or does not belong to this property');
    }

    // Ensure all JSON fields are properly stringified
    const roomDataWithStringifiedJson = {
      name: roomData.name,
      room_type: roomData.room_type,
      beds: JSON.stringify(roomData.beds || []),
      max_occupancy: roomData.max_occupancy,
      base_price: roomData.base_price,
      cleaning_fee: roomData.cleaning_fee,
      service_fee: roomData.service_fee,
      tax_rate: roomData.tax_rate,
      security_deposit: roomData.security_deposit,
      description: roomData.description,
      bathroom_type: normalizedBathroomType,
      view_type: roomData.view_type,
      has_private_bathroom: roomData.has_private_bathroom,
      smoking: roomData.smoking,
      accessibility_features: JSON.stringify(roomData.accessibility_features || []),
      floor_level: roomData.floor_level,
      has_balcony: roomData.has_balcony,
      has_kitchen: roomData.has_kitchen,
      has_minibar: roomData.has_minibar,
      climate: JSON.stringify(roomData.climate || null),
      price_per_night: roomData.price_per_night,
      cancellation_policy: roomData.cancellation_policy,
      includes_breakfast: roomData.includes_breakfast,
      extra_bed_available: roomData.extra_bed_available,
      pets_allowed: roomData.pets_allowed,
      images: JSON.stringify(roomData.images || []),
      cleaning_frequency: roomData.cleaning_frequency,
      has_toiletries: roomData.has_toiletries,
      has_towels_linens: roomData.has_towels_linens,
      has_room_service: roomData.has_room_service,
      flooring_type: roomData.flooring_type,
      energy_saving_features: JSON.stringify(roomData.energy_saving_features || []),
      status: roomData.status || 'available',
      room_size: roomData.room_size,
      amenities: JSON.stringify(roomData.amenities || []),
      updated_at: new Date()
    };

    console.log('Room data before update:', roomDataWithStringifiedJson);

    const [result] = await connection.query(
      'UPDATE rooms SET ? WHERE id = ?',
      [roomDataWithStringifiedJson, roomId]
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

    // Parse JSON fields in the response
    const formattedRoom = {
      ...updatedRoom[0],
      beds: JSON.parse(updatedRoom[0].beds || '[]'),
      amenities: JSON.parse(updatedRoom[0].amenities || '[]'),
      accessibility_features: JSON.parse(updatedRoom[0].accessibility_features || '[]'),
      climate: JSON.parse(updatedRoom[0].climate || 'null'),
      images: JSON.parse(updatedRoom[0].images || '[]'),
      energy_saving_features: JSON.parse(updatedRoom[0].energy_saving_features || '[]')
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
