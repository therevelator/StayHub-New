import db from '../db/index.js';
import * as propertyModel from '../models/property.model.js';
import * as roomModel from '../models/room.model.js';
// Removed uuid import as we're using custom booking reference
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export const createRoom = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const roomData = req.body;

    console.log('[RoomController] Creating room with data:', JSON.stringify(roomData, null, 2));
    console.log('[RoomController] Property ID:', propertyId);

    // Validate required fields based on schema
    if (!roomData.name || !roomData.room_type || !roomData.max_occupancy) {
      console.log('[RoomController] Validation failed:', { 
        name: roomData.name,
        room_type: roomData.room_type,
        max_occupancy: roomData.max_occupancy
      });
      return res.status(400).json({
        status: 'error',
        message: 'Name, room type, and max occupancy are required'
      });
    }

    // Create room
    console.log('[RoomController] Executing query with values:', {
      propertyId,
      name: roomData.name,
      room_type: roomData.room_type,
      max_occupancy: roomData.max_occupancy
    });

    const query = `INSERT INTO rooms (
      property_id,
      name,
      room_type,
      bed_type,
      beds,
      max_occupancy,
      base_price,
      cleaning_fee,
      service_fee,
      tax_rate,
      security_deposit,
      description,
      bathroom_type,
      view_type,
      has_private_bathroom,
      smoking,
      accessibility_features,
      floor_level,
      has_balcony,
      has_kitchen,
      has_minibar,
      climate,
      price_per_night,
      cancellation_policy,
      includes_breakfast,
      extra_bed_available,
      pets_allowed,
      images,
      cleaning_frequency,
      has_toiletries,
      has_towels_linens,
      has_room_service,
      flooring_type,
      energy_saving_features,
      status,
      room_size,
      amenities
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      propertyId,
      roomData.name,
      roomData.room_type || 'Standard Room',
      roomData.bed_type || null,
      JSON.stringify(roomData.beds || []),
      roomData.max_occupancy || 2,
      roomData.base_price || 0,
      roomData.cleaning_fee || 0,
      roomData.service_fee || 0,
      roomData.tax_rate || 0,
      roomData.security_deposit || 0,
      roomData.description || null,
      roomData.bathroom_type || 'private',
      roomData.view_type || null,
      roomData.has_private_bathroom === false ? 0 : 1,
      roomData.smoking === true ? 1 : 0,
      JSON.stringify(roomData.accessibility_features || []),
      roomData.floor_level || null,
      roomData.has_balcony === true ? 1 : 0,
      roomData.has_kitchen === true ? 1 : 0,
      roomData.has_minibar === true ? 1 : 0,
      JSON.stringify(roomData.climate || {type: 'ac', available: true}),
      roomData.price_per_night || null,
      roomData.cancellation_policy || null,
      roomData.includes_breakfast === true ? 1 : 0,
      roomData.extra_bed_available === true ? 1 : 0,
      roomData.pets_allowed === true ? 1 : 0,
      JSON.stringify(roomData.images || []),
      roomData.cleaning_frequency || null,
      roomData.has_toiletries === false ? 0 : 1,
      roomData.has_towels_linens === false ? 0 : 1,
      roomData.has_room_service === true ? 1 : 0,
      roomData.flooring_type || null,
      JSON.stringify(roomData.energy_saving_features || []),
      roomData.status || 'available',
      roomData.room_size || null,
      JSON.stringify(roomData.amenities || [])
    ];

    console.log('[RoomController] Query:', query);
    console.log('[RoomController] Values:', JSON.stringify(values, null, 2));

    const [result] = await db.query(query, values);


    console.log('[RoomController] Room created with ID:', result.insertId);

    res.json({
      status: 'success',
      message: 'Room created successfully',
      data: {
        roomId: result.insertId
      }
    });
  } catch (error) {
    console.error('[RoomController] Error creating room:', error);
    console.error('[RoomController] Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create room'
    });
  }
};

export const getRooms = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const [rooms] = await db.query(`
      SELECT 
        r.*,
        p.name as property_name,
        p.location as property_location,
        p.type as property_type,
        p.rating as property_rating
      FROM rooms r
      JOIN properties p ON r.property_id = p.id
      WHERE r.property_id = ?
    `, [propertyId]);

    console.log('Raw rooms from DB:', rooms);
    
    // Parse JSON fields for each room
    const parsedRooms = rooms.map(room => ({
      ...room,
      beds: room.beds ? JSON.parse(room.beds) : [],
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      accessibility_features: room.accessibility_features ? JSON.parse(room.accessibility_features) : [],
      energy_saving_features: room.energy_saving_features ? JSON.parse(room.energy_saving_features) : [],
      climate: room.climate ? JSON.parse(room.climate) : { type: 'ac', available: true },
      images: room.images ? JSON.parse(room.images) : [],
      // Convert boolean fields
      has_private_bathroom: Boolean(room.has_private_bathroom),
      smoking: Boolean(room.smoking),
      has_balcony: Boolean(room.has_balcony),
      has_kitchen: Boolean(room.has_kitchen),
      has_minibar: Boolean(room.has_minibar),
      includes_breakfast: Boolean(room.includes_breakfast),
      extra_bed_available: Boolean(room.extra_bed_available),
      pets_allowed: Boolean(room.pets_allowed),
      has_toiletries: Boolean(room.has_toiletries),
      has_towels_linens: Boolean(room.has_towels_linens),
      has_room_service: Boolean(room.has_room_service)
    }));

    console.log('Parsed rooms:', parsedRooms);
    
    res.json({
      status: 'success',
      data: parsedRooms
    });
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get rooms'
    });
  }
};

export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoomHelper(roomId);

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get room'
    });
  }
};

export const getRoomAvailability = async (req, res) => {
  try {
    const { propertyId, roomId } = req.params;
    const { startDate, endDate } = req.query;
    
    console.log('Checking availability for roomId:', roomId, 'between:', startDate, 'and', endDate);
    
    // Get room details including default price
    const [rooms] = await db.query(
      'SELECT id, price_per_night FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, propertyId]
    );

    if (rooms.length === 0) {
      console.log('Room not found:', roomId);
      return res.status(404).json({
        status: 'error',
        message: 'Room not found or does not belong to this property'
      });
    }

    const defaultPrice = rooms[0].price_per_night;
    
    // Get all rooms for this property to check their availability
    const [propertyRooms] = await db.query(
      'SELECT id, price_per_night FROM rooms WHERE property_id = (SELECT property_id FROM rooms WHERE id = ?)',
      [roomId]
    );

    // Get both availability records and bookings for the specified date range
    const [availability] = await db.query(`
      SELECT 
        DATE(date) as date,
        status,
        reason,
        price,
        notes,
        booking_id,
        room_id
      FROM room_availability 
      WHERE room_id IN (${propertyRooms.map(r => r.id).join(',')})
      AND date >= ?
      AND date <= ?
    `, [startDate || new Date(), endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);

    // Get bookings that overlap with the date range for all rooms
    const [bookings] = await db.query(`
      SELECT 
        id,
        room_id,
        DATE_FORMAT(check_in_date, '%Y-%m-%d') as check_in_date,
        DATE_FORMAT(check_out_date, '%Y-%m-%d') as check_out_date
      FROM bookings
      WHERE room_id IN (${propertyRooms.map(r => r.id).join(',')})
      AND status != 'cancelled'
      AND (
        (check_in_date BETWEEN ? AND ?)
        OR (check_out_date BETWEEN ? AND ?)
        OR (check_in_date <= ? AND check_out_date >= ?)
      )
    `, [startDate, endDate, startDate, endDate, startDate, endDate]);
    
    console.log('Found bookings:', bookings);

    console.log('Found availability records:', availability);

    // Create availability maps for each room
    const roomAvailabilityMaps = {};
    
    // Initialize availability maps for all rooms
    propertyRooms.forEach(room => {
      const dateRange = eachDayOfInterval({ 
        start: new Date(startDate), 
        end: new Date(endDate) 
      });
      
      roomAvailabilityMaps[room.id] = {};
      dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        roomAvailabilityMaps[room.id][dateStr] = {
          status: 'available',
          reason: 'default availability',
          price: room.price_per_night,
          notes: null,
          booking_id: null
        };
      });
    });

    // Overlay availability records for each room
    availability.forEach(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      if (roomAvailabilityMaps[record.room_id]) {
        roomAvailabilityMaps[record.room_id][dateStr] = {
          status: record.status || 'available',
          reason: record.reason || 'available',
          price: parseFloat(record.price) || propertyRooms.find(r => r.id === record.room_id)?.price_per_night,
          notes: record.notes,
          booking_id: record.booking_id
        };
      }
    });

    // Overlay booking information for each room
    bookings.forEach(booking => {
      const start = new Date(booking.check_in_date);
      const end = new Date(booking.check_out_date);
      const dates = eachDayOfInterval({ start, end });
      
      dates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        if (roomAvailabilityMaps[booking.room_id] && roomAvailabilityMaps[booking.room_id][dateStr]) {
          roomAvailabilityMaps[booking.room_id][dateStr] = {
            ...roomAvailabilityMaps[booking.room_id][dateStr],
            status: 'occupied',
            reason: 'booked',
            booking_id: booking.id
          };
        }
      });
    });

    // For the requested room, return its availability map
    // Get room details for all rooms
    const [roomDetails] = await db.query(
      'SELECT id, name, room_type, max_occupancy FROM rooms WHERE id IN (?)',
      [Object.keys(roomAvailabilityMaps)]
    );

    // Create a map of room details
    const roomDetailsMap = roomDetails.reduce((acc, room) => {
      acc[room.id] = room;
      return acc;
    }, {});

    const responseData = {
      status: 'success',
      data: {
        default_price: defaultPrice,
        requested_room: {
          ...roomDetailsMap[roomId],
          availability: roomAvailabilityMaps[roomId]
        },
        other_rooms: Object.entries(roomAvailabilityMaps)
          .filter(([id]) => id !== roomId)
          .map(([id, availability]) => ({
            ...roomDetailsMap[id],
            availability,
            is_available: Object.values(availability).every(day => day.status === 'available')
          }))
      }
    };
    
    console.log('Sending availability response:', responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Error getting room availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get room availability'
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const roomData = req.body;

    console.log('[RoomController] Updating room:', roomId);
    console.log('[RoomController] Update data:', JSON.stringify(roomData, null, 2));

    // Check if room exists
    const room = await getRoomHelper(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    // Validate required fields based on schema
    if (!roomData.name || !roomData.room_type || !roomData.max_occupancy) {
      console.log('[RoomController] Validation failed:', {
        name: roomData.name,
        room_type: roomData.room_type,
        max_occupancy: roomData.max_occupancy
      });
      return res.status(400).json({
        status: 'error',
        message: 'Name, room type, and max occupancy are required'
      });
    }

    // Update room
    const query = `
      UPDATE rooms
      SET
        name = ?,
        room_type = ?,
        bed_type = ?,
        beds = ?,
        max_occupancy = ?,
        base_price = ?,
        cleaning_fee = ?,
        service_fee = ?,
        tax_rate = ?,
        security_deposit = ?,
        description = ?,
        bathroom_type = ?,
        view_type = ?,
        has_private_bathroom = ?,
        smoking = ?,
        accessibility_features = ?,
        floor_level = ?,
        has_balcony = ?,
        has_kitchen = ?,
        has_minibar = ?,
        climate = ?,
        price_per_night = ?,
        cancellation_policy = ?,
        includes_breakfast = ?,
        extra_bed_available = ?,
        pets_allowed = ?,
        images = ?,
        cleaning_frequency = ?,
        has_toiletries = ?,
        has_towels_linens = ?,
        has_room_service = ?,
        flooring_type = ?,
        energy_saving_features = ?,
        status = ?,
        room_size = ?,
        amenities = ?
      WHERE id = ?
    `;

    const values = [
      roomData.name,
      roomData.room_type || 'Standard Room',
      roomData.bed_type || null,
      JSON.stringify(roomData.beds || []),
      roomData.max_occupancy || 2,
      roomData.base_price || 0,
      roomData.cleaning_fee || 0,
      roomData.service_fee || 0,
      roomData.tax_rate || 0,
      roomData.security_deposit || 0,
      roomData.description || null,
      roomData.bathroom_type || 'private',
      roomData.view_type || null,
      roomData.has_private_bathroom === false ? 0 : 1,
      roomData.smoking === true ? 1 : 0,
      JSON.stringify(roomData.accessibility_features || []),
      roomData.floor_level || null,
      roomData.has_balcony === true ? 1 : 0,
      roomData.has_kitchen === true ? 1 : 0,
      roomData.has_minibar === true ? 1 : 0,
      JSON.stringify(roomData.climate || {type: 'ac', available: true}),
      roomData.price_per_night || null,
      roomData.cancellation_policy || null,
      roomData.includes_breakfast === true ? 1 : 0,
      roomData.extra_bed_available === true ? 1 : 0,
      roomData.pets_allowed === true ? 1 : 0,
      JSON.stringify(roomData.images || []),
      roomData.cleaning_frequency || null,
      roomData.has_toiletries === false ? 0 : 1,
      roomData.has_towels_linens === false ? 0 : 1,
      roomData.has_room_service === true ? 1 : 0,
      roomData.flooring_type || null,
      JSON.stringify(roomData.energy_saving_features || []),
      roomData.status || 'available',
      roomData.room_size || null,
      JSON.stringify(roomData.amenities || []),
      roomId
    ];

    console.log('[RoomController] Update query:', query);
    console.log('[RoomController] Update values:', JSON.stringify(values, null, 2));

    await db.query(query, values);

    res.json({
      status: 'success',
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('[RoomController] Error updating room:', error);
    console.error('[RoomController] Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update room'
    });
  }
};

export const deleteRoom = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const { roomId } = req.params;

    // Check if room exists
    const room = await getRoomHelper(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    // Check for active bookings only (pending or confirmed)
    const [activeBookings] = await connection.query(
      'SELECT id, status FROM bookings WHERE room_id = ? AND status IN ("pending", "confirmed")',
      [roomId]
    );

    if (activeBookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete room because it has active bookings. Please cancel or complete all bookings for this room first.',
        code: 'ACTIVE_BOOKINGS'
      });
    }

    // Delete all cancelled bookings
    await connection.query(
      'DELETE FROM bookings WHERE room_id = ? AND status = "cancelled"',
      [roomId]
    );

    // Delete all room availability records (maintenance, price modifications, etc)
    await connection.query(
      'DELETE FROM room_availability WHERE room_id = ?',
      [roomId]
    );

    // Then delete the room
    await connection.query('DELETE FROM rooms WHERE id = ?', [roomId]);
    await connection.commit();

    res.json({
      status: 'success',
      message: 'Room deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting room:', error);
    res.status(500).json({
      status: 'error',
      message: error.code === 'ER_ROW_IS_REFERENCED_2' 
        ? 'Cannot delete room because it has active bookings. Please cancel or complete all bookings for this room first.'
        : 'Failed to delete room',
      code: error.code || 'UNKNOWN_ERROR'
    });
  } finally {
    connection.release();
  }
};

const getRoomHelper = async (roomId) => {
  const [rooms] = await db.query(`
    SELECT 
      r.id,
      r.property_id,
      r.name,
      r.room_type,
      r.bed_type,
      IF(r.beds IS NULL OR r.beds = '', '[]', r.beds) as beds,
      r.max_occupancy,
      r.base_price,
      r.cleaning_fee,
      r.service_fee,
      r.tax_rate,
      r.security_deposit,
      r.description,
      r.created_at,
      r.updated_at,
      r.bathroom_type,
      r.view_type,
      r.has_private_bathroom,
      r.smoking,
      IF(r.accessibility_features IS NULL OR r.accessibility_features = '', '[]', r.accessibility_features) as accessibility_features,
      r.floor_level,
      r.has_balcony,
      r.has_kitchen,
      r.has_minibar,
      IF(r.climate IS NULL OR r.climate = '', '{"type":"ac","available":true}', r.climate) as climate,
      r.price_per_night,
      r.cancellation_policy,
      r.includes_breakfast,
      r.extra_bed_available,
      r.pets_allowed,
      IF(r.images IS NULL OR r.images = '', '[]', r.images) as images,
      r.cleaning_frequency,
      r.has_toiletries,
      r.has_towels_linens,
      r.has_room_service,
      r.flooring_type,
      IF(r.energy_saving_features IS NULL OR r.energy_saving_features = '', '[]', r.energy_saving_features) as energy_saving_features,
      r.status,
      r.room_size,
      IF(r.amenities IS NULL OR r.amenities = '', '[]', r.amenities) as amenities,
      p.name as property_name,
      CONCAT(p.street, ', ', p.city, ', ', p.country) as property_location,
      p.property_type,
      p.rating,
      p.star_rating,
      p.check_in_time,
      p.check_out_time,
      p.cancellation_policy,
      p.house_rules,
      p.min_stay,
      p.max_stay
    FROM rooms r
    JOIN properties p ON r.property_id = p.id
    WHERE r.id = ?
  `, [roomId]);

  if (!rooms[0]) return null;

  // Parse JSON fields
  const room = {
    ...rooms[0],
    beds: rooms[0].beds ? JSON.parse(rooms[0].beds) : [],
    amenities: rooms[0].amenities ? JSON.parse(rooms[0].amenities) : [],
    accessibility_features: rooms[0].accessibility_features ? JSON.parse(rooms[0].accessibility_features) : [],
    energy_saving_features: rooms[0].energy_saving_features ? JSON.parse(rooms[0].energy_saving_features) : [],
    climate: rooms[0].climate ? JSON.parse(rooms[0].climate) : { type: 'ac', available: true },
    images: rooms[0].images ? JSON.parse(rooms[0].images) : [],
    // Convert boolean fields
    has_private_bathroom: Boolean(rooms[0].has_private_bathroom),
    smoking: Boolean(rooms[0].smoking),
    has_balcony: Boolean(rooms[0].has_balcony),
    has_kitchen: Boolean(rooms[0].has_kitchen),
    has_minibar: Boolean(rooms[0].has_minibar),
    includes_breakfast: Boolean(rooms[0].includes_breakfast),
    extra_bed_available: Boolean(rooms[0].extra_bed_available),
    pets_allowed: Boolean(rooms[0].pets_allowed),
    has_toiletries: Boolean(rooms[0].has_toiletries),
    has_towels_linens: Boolean(rooms[0].has_towels_linens),
    has_room_service: Boolean(rooms[0].has_room_service)
  };

  return room;
};

export const createBooking = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests,
      contactEmail
    } = req.body;

    // Validate required fields
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Check-in and check-out dates are required'
      });
    }
    
    const userId = req.user.id;
    console.log('Creating booking for user:', userId);

    // Get room details to get default price
    const [rooms] = await db.query('SELECT id, price_per_night FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    const room = rooms[0];
    const defaultPrice = room.price_per_night;
    
    // Calculate number of nights
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Get custom prices for the date range
    const [customPrices] = await db.query(`
      SELECT date, price 
      FROM room_availability 
      WHERE room_id = ? 
      AND date >= ? 
      AND date < ?
      AND status = 'available'
    `, [roomId, checkInDate, checkOutDate]);

    // Create a map of custom prices by date
    const customPriceMap = {};
    customPrices.forEach(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      customPriceMap[dateStr] = parseFloat(record.price);
    });

    // Calculate total price using custom prices where available
    let totalPrice = 0;
    const priceBreakdown = {};
    
    for (let i = 0; i < numberOfNights; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayPrice = parseFloat(customPriceMap[dateStr] || defaultPrice);
      priceBreakdown[dateStr] = dayPrice;
      totalPrice += dayPrice;
    }

    console.log('Price breakdown:', priceBreakdown);
    console.log('Total price:', totalPrice);

    // Check if dates are available by looking for any overlapping bookings
    const [existingBookings] = await db.query(`
      SELECT id 
      FROM bookings 
      WHERE room_id = ? 
      AND status = 'confirmed'
      AND NOT (
        check_out_date <= ? -- New booking starts after existing booking ends
        OR 
        check_in_date >= ? -- New booking ends before existing booking starts
      )
    `, [
      roomId,
      checkInDate, // Existing booking must end before new booking starts
      checkOutDate // Existing booking must start after new booking ends
    ]);

    if (existingBookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Room is not available for the selected dates'
      });
    }

    // Generate a unique booking reference in format BK-XXXXXXXX
    const bookingReference = generateBookingReference();

    // Create the booking
    const [result] = await db.query(`
      INSERT INTO bookings (
        room_id,
        user_id,
        check_in_date,
        check_out_date,
        total_price,
        number_of_guests,
        special_requests,
        booking_reference,
        contact_email,
        status,
        payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      roomId,
      userId,
      checkInDate,
      checkOutDate,
      totalPrice.toFixed(2), // Ensure we have a properly formatted decimal
      numberOfGuests || 1,
      specialRequests || null,
      bookingReference,
      contactEmail || null,
      'confirmed',
      'pending'
    ]);

    res.json({
      status: 'success',
      message: 'Booking created successfully',
      data: {
        bookingId: result.insertId,
        bookingReference,
        totalPrice,
        numberOfNights,
        checkInDate,
        checkOutDate,
        priceBreakdown
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create booking'
    });
  }
};

export const getRoomReservations = async (req, res) => {
  try {
    const { propertyId, roomId } = req.params;
    
    // First verify that the room exists and belongs to the property
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

    // Get all reservations for this room
    const [reservations] = await db.query(`
      SELECT 
        b.id,
        b.user_id,
        b.check_in_date,
        b.check_out_date,
        b.status,
        b.total_price,
        b.number_of_guests,
        b.special_requests,
        b.booking_reference,
        b.contact_email,
        b.payment_status,
        b.created_at,
        b.updated_at,
        u.first_name,
        u.last_name,
        u.email
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.room_id = ?
      AND b.status != 'cancelled'
      ORDER BY b.check_in_date DESC
    `, [roomId]);

    res.json({
      status: 'success',
      data: reservations
    });
  } catch (error) {
    console.error('Error fetching room reservations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch room reservations'
    });
  }
};

const generateBookingReference = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let reference = 'BK-';
  for (let i = 0; i < 8; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
};

export const updateRoomAvailability = async (req, res) => {
  try {
    const { propertyId, roomId } = req.params;
    const { updates } = req.body;

    // First verify that the room exists and belongs to the property
    const [rooms] = await db.query(
      'SELECT id, price_per_night FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, propertyId]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found or does not belong to this property'
      });
    }

    // Process each update in the batch
    for (const update of updates) {
      const { date, price, status, notes } = update;
      const finalPrice = parseFloat(price) || rooms[0].price_per_night;
      const finalStatus = status || 'available';
      const reason = status || 'available';

      // Check if there's an existing availability record for this date
      const [existingAvailability] = await db.query(
        'SELECT id FROM room_availability WHERE room_id = ? AND date = ?',
        [roomId, date]
      );

      if (existingAvailability.length > 0) {
        // Update existing record
        await db.query(
          `UPDATE room_availability 
           SET price = ?, status = ?, reason = ?, notes = ?, updated_at = NOW()
           WHERE room_id = ? AND date = ?`,
          [finalPrice, finalStatus, reason, notes || null, roomId, date]
        );
      } else {
        // Create new record
        await db.query(
          `INSERT INTO room_availability 
           (room_id, date, price, status, reason, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [roomId, date, finalPrice, finalStatus, reason, notes || null]
        );
      }
    }

    res.json({
      status: 'success',
      message: 'Room availability updated successfully',
      data: {
        updated: updates.length
      }
    });
  } catch (error) {
    console.error('Error updating room availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update room availability'
    });
  }
};
