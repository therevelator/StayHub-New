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

export const createRoom = async (propertyId, roomData) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Ensure all JSON fields are properly stringified
    const roomDataWithStringifiedJson = {
      property_id: propertyId,
      name: roomData.name,
      room_type: roomData.room_type,
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
      status: roomData.status || 'available'
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
    return { id: result.insertId, ...roomData };

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
      CAST(JSON_OBJECT(
        'type', r.bed_type,
        'count', 1
      ) AS JSON) as beds,
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
      beds: typeof row.beds === 'string' ? JSON.parse(row.beds) : row.beds,
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

    // Remove problematic fields
    const {
      room_amenities,
      bed_type,
      property_id,
      created_at,
      updated_at,
      ...cleanData
    } = roomData;

    // Ensure all JSON fields are properly stringified
    const updateData = {
      ...cleanData,
      beds: typeof cleanData.beds === 'string' ? cleanData.beds : JSON.stringify(cleanData.beds || []),
      amenities: typeof cleanData.amenities === 'string' ? cleanData.amenities : JSON.stringify(cleanData.amenities || []),
      accessibility_features: typeof cleanData.accessibility_features === 'string' 
        ? cleanData.accessibility_features 
        : JSON.stringify(cleanData.accessibility_features || []),
      energy_saving_features: typeof cleanData.energy_saving_features === 'string'
        ? cleanData.energy_saving_features
        : JSON.stringify(cleanData.energy_saving_features || []),
      images: typeof cleanData.images === 'string' ? cleanData.images : JSON.stringify(cleanData.images || []),
      // Price fields - ensure they're properly handled
      base_price: cleanData.base_price === '' ? null : cleanData.base_price,
      cleaning_fee: cleanData.cleaning_fee === '' ? null : cleanData.cleaning_fee,
      service_fee: cleanData.service_fee === '' ? null : cleanData.service_fee,
      tax_rate: cleanData.tax_rate === '' ? null : cleanData.tax_rate,
      security_deposit: cleanData.security_deposit === '' ? null : cleanData.security_deposit,
      price_per_night: cleanData.price_per_night === '' ? null : cleanData.price_per_night,
      // Use MySQL CURRENT_TIMESTAMP for updated_at
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Only remove undefined values, keep null values for prices
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('Updating room with data:', updateData); // Debug log

    // Update room using a single query with the prepared data
    const [result] = await connection.query(
      'UPDATE rooms SET ? WHERE id = ?',
      [updateData, roomId]
    );

    await connection.commit();
    return { id: roomId, ...updateData };

  } catch (error) {
    console.error('Error updating room:', error); // Debug log
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
