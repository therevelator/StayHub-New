import db from '../db/index.js';
import * as propertyModel from '../models/property.model.js';
import * as roomModel from '../models/room.model.js';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export const createRoom = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const property = await propertyModel.getPropertyById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    console.log('Request body:', req.body);
    const result = await roomModel.createRoom(propertyId, req.body);
    
    // Format the response data
    const formattedRoom = {
      ...result,
      beds: typeof result.beds === 'string' ? JSON.parse(result.beds) : result.beds,
      amenities: typeof result.amenities === 'string' ? JSON.parse(result.amenities) : result.amenities,
      accessibility_features: typeof result.accessibility_features === 'string' ? JSON.parse(result.accessibility_features) : result.accessibility_features,
      climate: typeof result.climate === 'string' ? JSON.parse(result.climate) : result.climate,
      images: typeof result.images === 'string' ? JSON.parse(result.images) : result.images,
      energy_saving_features: typeof result.energy_saving_features === 'string' ? JSON.parse(result.energy_saving_features) : result.energy_saving_features
    };

    res.status(201).json({
      status: 'success',
      data: formattedRoom
    });
  } catch (error) {
    console.error('Error in createRoom controller:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error creating room',
      error: error.message 
    });
  }
};

export const getRooms = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const [rooms] = await db.query(`
      SELECT 
        id,
        property_id,
        name,
        room_type,
        beds,
        room_size,
        max_occupancy,
        view_type,
        has_private_bathroom,
        amenities,
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
        description,
        has_toiletries,
        has_towels_linens,
        has_room_service,
        flooring_type,
        energy_saving_features,
        status,
        created_at,
        updated_at
      FROM rooms 
      WHERE property_id = ?
    `, [propertyId]);

    // Parse JSON fields
    const formattedRooms = rooms.map(room => ({
      ...room,
      beds: JSON.parse(room.beds),
      amenities: JSON.parse(room.amenities),
      accessibility_features: JSON.parse(room.accessibility_features),
      climate: JSON.parse(room.climate),
      images: JSON.parse(room.images),
      energy_saving_features: JSON.parse(room.energy_saving_features)
    }));

    res.json({
      status: 'success',
      data: formattedRooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching rooms',
      error: error.message 
    });
  }
};

// Helper function (not exported)
const getRoomHelper = async (roomId) => {
  try {
    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE id = ?',
      [roomId]
    );
    
    if (!rooms || rooms.length === 0) {
      return null;
    }
    
    return rooms[0];
  } catch (error) {
    console.error('Error getting room:', error);
    throw error;
  }
};

// Exported controller functions
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
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required'
      });
    }

    console.log('Checking availability for roomId:', roomId, 'from:', startDate, 'to:', endDate);
    
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
    
    // First, get all dates in the range
    const [dates] = await db.query(`
      WITH RECURSIVE date_range AS (
        SELECT ? as date
        UNION ALL
        SELECT DATE_ADD(date, INTERVAL 1 DAY)
        FROM date_range
        WHERE date < ?
      )
      SELECT DATE(date) as date
      FROM date_range
    `, [startDate, endDate]);

    // Get all availability records for this room
    const [availability] = await db.query(`
      SELECT 
        DATE(ra.date) as date,
        ra.status,
        ra.price,
        ra.booking_id,
        ra.notes
      FROM room_availability ra
      WHERE ra.room_id = ? 
        AND ra.date >= ?
        AND ra.date <= ?
        AND ra.status IN ('maintenance', 'blocked')
    `, [roomId, startDate, endDate]);

    // Get all bookings for this room in the date range
    const [bookings] = await db.query(`
      SELECT 
        id,
        DATE(check_in_date) as check_in_date,
        DATE(check_out_date) as check_out_date
      FROM bookings 
      WHERE room_id = ? 
        AND status = 'confirmed'
        AND (
          (check_in_date BETWEEN ? AND ?) OR
          (check_out_date BETWEEN ? AND ?) OR
          (check_in_date <= ? AND check_out_date >= ?)
        )
    `, [roomId, startDate, endDate, startDate, endDate, startDate, endDate]);

    console.log('Found bookings:', bookings);
    console.log('Found availability records:', availability);

    // Create a map of booked dates
    const bookedDates = new Set();
    bookings.forEach(booking => {
      let currentDate = new Date(booking.check_in_date);
      const endDate = new Date(booking.check_out_date);
      
      while (currentDate <= endDate) {
        bookedDates.add(format(currentDate, 'yyyy-MM-dd'));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Create a map of existing availability records
    const existingAvailability = {};
    availability.forEach(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      existingAvailability[dateStr] = record;
    });

    // Convert to object with dates as keys, including all dates in range
    const availabilityMap = {};
    dates.forEach(({ date }) => {
      const dateStr = format(new Date(date), 'yyyy-MM-dd');
      const existing = existingAvailability[dateStr];
      
      if (bookedDates.has(dateStr)) {
        availabilityMap[dateStr] = {
          status: 'occupied',
          price: parseFloat(defaultPrice),
          booking_id: null,
          notes: null
        };
      } else if (existing) {
        // Use the existing record's status (maintenance or blocked)
        availabilityMap[dateStr] = {
          status: existing.status,
          price: parseFloat(existing.price) || defaultPrice,
          booking_id: existing.booking_id,
          notes: existing.notes
        };
      } else {
        availabilityMap[dateStr] = {
          status: 'available',
          price: parseFloat(defaultPrice),
          booking_id: null,
          notes: null
        };
      }
    });

    res.json({
      status: 'success',
      data: {
        default_price: defaultPrice,
        availability: availabilityMap
      }
    });
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
    const roomId = req.params.roomId;
    const propertyId = req.params.propertyId;
    console.log('[Server] Updating room:', { roomId, propertyId });
    console.log('[Server] Update data:', req.body);

    // First verify the room belongs to this property
    const [rooms] = await db.query(
      'SELECT id FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, propertyId]
    );

    if (rooms.length === 0) {
      console.log('[Server] Room not found or does not belong to property');
      return res.status(404).json({
        status: 'error',
        message: 'Room not found or does not belong to this property'
      });
    }

    // Format the room data
    const roomData = {
      ...req.body,
      property_id: propertyId,
      beds: Array.isArray(req.body.beds) 
        ? JSON.stringify(req.body.beds)
        : typeof req.body.beds === 'string'
          ? req.body.beds
          : JSON.stringify([]),
      amenities: JSON.stringify(req.body.amenities || []),
      accessibility_features: JSON.stringify(req.body.accessibility_features || []),
      energy_saving_features: JSON.stringify(req.body.energy_saving_features || []),
      images: JSON.stringify(req.body.images || []),
      has_private_bathroom: req.body.has_private_bathroom ? 1 : 0,
      smoking: req.body.smoking ? 1 : 0,
      has_balcony: req.body.has_balcony ? 1 : 0,
      has_kitchen: req.body.has_kitchen ? 1 : 0,
      has_minibar: req.body.has_minibar ? 1 : 0,
      includes_breakfast: req.body.includes_breakfast ? 1 : 0,
      extra_bed_available: req.body.extra_bed_available ? 1 : 0,
      pets_allowed: req.body.pets_allowed ? 1 : 0,
      has_toiletries: req.body.has_toiletries ? 1 : 0,
      has_towels_linens: req.body.has_towels_linens ? 1 : 0,
      has_room_service: req.body.has_room_service ? 1 : 0,
      updated_at: new Date()
    };

    console.log('[Server] Formatted room data:', roomData);

    const result = await roomModel.updateRoom(roomId, roomData);
    console.log('[Server] Update result:', result);
    
    if (result.affectedRows > 0) {
      // Get the updated room data
      const [updatedRoom] = await db.query(
        'SELECT * FROM rooms WHERE id = ?',
        [roomId]
      );
      
      if (updatedRoom.length > 0) {
        // Parse the stringified fields for the response
        const responseData = {
          ...updatedRoom[0],
          beds: JSON.parse(updatedRoom[0].beds),
          amenities: JSON.parse(updatedRoom[0].amenities),
          accessibility_features: JSON.parse(updatedRoom[0].accessibility_features),
          energy_saving_features: JSON.parse(updatedRoom[0].energy_saving_features),
          images: JSON.parse(updatedRoom[0].images)
        };

        console.log('[Server] Sending response:', responseData);
        res.json({
          status: 'success',
          message: 'Room updated successfully',
          data: responseData
        });
      } else {
        throw new Error('Failed to fetch updated room data');
      }
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Room not found or no changes made'
      });
    }
  } catch (error) {
    console.error('[Server] Error in updateRoom controller:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating room',
      error: error.message
    });
  }
};

export const deleteRoom = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const roomId = req.params.roomId;
    const propertyId = req.params.propertyId;

    // Check if room exists and get property info
    const [rooms] = await connection.query(
      'SELECT id, property_id FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, propertyId]
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Room not found or does not belong to this property'
      });
    }

    // Check for existing bookings
    const [bookings] = await connection.query(
      'SELECT id FROM bookings WHERE room_id = ? AND status != "cancelled"',
      [roomId]
    );

    if (bookings.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete room with existing bookings'
      });
    }

    // Delete any cancelled bookings
    await connection.query(
      'DELETE FROM bookings WHERE room_id = ? AND status = "cancelled"',
      [roomId]
    );

    // Delete the room
    const [result] = await connection.query(
      'DELETE FROM rooms WHERE id = ? AND property_id = ?',
      [roomId, propertyId]
    );

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
      message: 'Error deleting room',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Add a new controller function for creating bookings
export const createBooking = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { 
      checkInDate, 
      checkOutDate, 
      numberOfGuests, 
      specialRequests,
      termsAccepted 
    } = req.body;

    if (!termsAccepted) {
      return res.status(400).json({
        status: 'error',
        message: 'Terms and conditions must be accepted'
      });
    }

    // Validate user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
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

    // Check if dates are available
    const [existingBookings] = await db.query(`
      SELECT id FROM bookings 
      WHERE room_id = ? 
      AND status IN ('confirmed', 'pending')
      AND (
        (check_in_date < ? AND check_out_date > ?) OR
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `, [roomId, checkOutDate, checkInDate, checkOutDate, checkInDate, checkInDate, checkOutDate]);

    if (existingBookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Selected dates are not available'
      });
    }

    // Get user email
    const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    const userEmail = users[0].email;

    // Generate booking reference
    const bookingReference = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create the booking
    const [result] = await db.query(`
      INSERT INTO bookings (
        room_id,
        user_id,
        check_in_date,
        check_out_date,
        status,
        total_price,
        number_of_guests,
        special_requests,
        booking_reference,
        contact_email,
        payment_status,
        terms_accepted
      ) VALUES (?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, 'pending', ?)
    `, [
      roomId,
      userId,
      checkInDate,
      checkOutDate,
      totalPrice.toFixed(2), // Ensure we have a properly formatted decimal
      numberOfGuests || 1,
      specialRequests || null,
      bookingReference,
      userEmail,
      termsAccepted
    ]);

    res.status(201).json({
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
      message: 'Internal server error'
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

export const updateRoomAvailability = async (req, res) => {
  try {
    const { propertyId, roomId } = req.params;
    const { date, price, status, updates } = req.body;

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

    const defaultPrice = rooms[0].price_per_night;

    if (updates && Array.isArray(updates)) {
      // Bulk update
      for (const update of updates) {
        const finalPrice = parseFloat(update.price) || defaultPrice;
        const finalStatus = update.status || 'available';

        // Check if there's an existing availability record for this date
        const [existingAvailability] = await db.query(
          'SELECT id FROM room_availability WHERE room_id = ? AND date = ?',
          [roomId, update.date]
        );

        if (existingAvailability.length > 0) {
          // Update existing record
          await db.query(
            `UPDATE room_availability 
             SET price = ?, status = ?, updated_at = NOW()
             WHERE room_id = ? AND date = ?`,
            [finalPrice, finalStatus, roomId, update.date]
          );
        } else {
          // Create new record
          await db.query(
            `INSERT INTO room_availability 
             (room_id, date, price, status)
             VALUES (?, ?, ?, ?)`,
            [roomId, update.date, finalPrice, finalStatus]
          );
        }
      }

      res.json({
        status: 'success',
        message: 'Room availability updated successfully',
        data: {
          status: updates[0].status,
          price: updates[0].price
        }
      });
    } else {
      // Single update
      const finalPrice = parseFloat(price) || defaultPrice;
      const finalStatus = status || 'available';

      // Check if there's an existing availability record for this date
      const [existingAvailability] = await db.query(
        'SELECT id FROM room_availability WHERE room_id = ? AND date = ?',
        [roomId, date]
      );

      if (existingAvailability.length > 0) {
        // Update existing record
        await db.query(
          `UPDATE room_availability 
           SET price = ?, status = ?, updated_at = NOW()
           WHERE room_id = ? AND date = ?`,
          [finalPrice, finalStatus, roomId, date]
        );
      } else {
        // Create new record
        await db.query(
          `INSERT INTO room_availability 
           (room_id, date, price, status)
           VALUES (?, ?, ?, ?)`,
          [roomId, date, finalPrice, finalStatus]
        );
      }

      res.json({
        status: 'success',
        message: 'Room availability updated successfully',
        data: {
          date,
          price: finalPrice,
          status: finalStatus
        }
      });
    }
  } catch (error) {
    console.error('Error updating room availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update room availability'
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

    // First get the current booking details
    const [bookings] = await db.query(
      'SELECT room_id, status FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];
    const roomId = booking.room_id;

    // Don't allow editing cancelled bookings
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot edit a cancelled booking'
      });
    }

    // Calculate number of nights
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Check for overlapping bookings (excluding the current booking)
    const [existingBookings] = await db.query(`
      SELECT id FROM bookings 
      WHERE room_id = ? 
      AND id != ?
      AND status IN ('confirmed', 'pending')
      AND (
        (check_in_date < ? AND check_out_date > ?) OR
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `, [roomId, bookingId, checkOutDate, checkInDate, checkOutDate, checkInDate, checkInDate, checkOutDate]);

    if (existingBookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Selected dates overlap with another booking'
      });
    }

    // Get room details and calculate new total price
    const [rooms] = await db.query('SELECT price_per_night FROM rooms WHERE id = ?', [roomId]);
    const defaultPrice = rooms[0].price_per_night;

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

    // Calculate new total price
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

    // Update the booking
    await db.query(`
      UPDATE bookings 
      SET 
        check_in_date = ?,
        check_out_date = ?,
        total_price = ?,
        number_of_guests = ?,
        special_requests = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      checkInDate,
      checkOutDate,
      totalPrice.toFixed(2),
      numberOfGuests || 1,
      specialRequests || null,
      bookingId
    ]);

    res.json({
      status: 'success',
      message: 'Booking updated successfully',
      data: {
        bookingId,
        totalPrice,
        numberOfNights,
        checkInDate,
        checkOutDate,
        priceBreakdown
      }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update booking'
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Check if booking exists and is not already cancelled
    const [bookings] = await db.query(
      'SELECT status FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (bookings[0].status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is already cancelled'
      });
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
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel booking'
    });
  }
};
