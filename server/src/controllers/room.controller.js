import db from '../db/index.js';
import * as propertyModel from '../models/property.model.js';
import * as roomModel from '../models/room.model.js';
import { v4 as uuidv4 } from 'uuid';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export const createRoom = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      name,
      description,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities
    } = req.body;

    // Validate required fields
    if (!name || !pricePerNight || !maxGuests) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, price per night, and max guests are required'
      });
    }

    // Create room
    const [result] = await db.query(`
      INSERT INTO rooms (
        property_id,
        name,
        description,
        price_per_night,
        max_guests,
        bedrooms,
        bathrooms,
        amenities
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      propertyId,
      name,
      description || null,
      pricePerNight,
      maxGuests,
      bedrooms || null,
      bathrooms || null,
      amenities ? JSON.stringify(amenities) : null
    ]);

    res.json({
      status: 'success',
      message: 'Room created successfully',
      data: {
        roomId: result.insertId
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

    res.json({
      status: 'success',
      data: rooms
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
    
    // Get both availability records and bookings for the specified date range
    const [availability] = await db.query(`
      SELECT 
        DATE(date) as date,
        status,
        reason,
        price,
        notes,
        booking_id
      FROM room_availability 
      WHERE room_id = ? 
      AND date >= ?
      AND date <= ?
    `, [roomId, startDate || new Date(), endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);

    // Get bookings that overlap with the date range
    const [bookings] = await db.query(`
      SELECT 
        id,
        DATE_FORMAT(check_in_date, '%Y-%m-%d') as check_in_date,
        DATE_FORMAT(check_out_date, '%Y-%m-%d') as check_out_date
      FROM bookings
      WHERE room_id = ?
      AND status != 'cancelled'
      AND (
        (check_in_date BETWEEN ? AND ?)
        OR (check_out_date BETWEEN ? AND ?)
        OR (check_in_date <= ? AND check_out_date >= ?)
      )
    `, [roomId, startDate, endDate, startDate, endDate, startDate, endDate]);
    
    console.log('Found bookings:', bookings);

    console.log('Found availability records:', availability);

    // Convert to object with dates as keys
    // First, map all availability records
    // Initialize all dates in range with NOT_AVAILABLE status
    const availabilityMap = {};
    const dateRange = eachDayOfInterval({ 
      start: new Date(startDate), 
      end: new Date(endDate) 
    });
    
    dateRange.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      availabilityMap[dateStr] = {
        status: 'blocked',
        reason: 'not configured yet',
        price: defaultPrice,
        notes: null,
        booking_id: null
      };
    });

    // Overlay availability records
    availability.forEach(record => {
      const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
      availabilityMap[dateStr] = {
        status: record.status || 'available',
        reason: record.reason || 'available',
        price: parseFloat(record.price) || defaultPrice,
        notes: record.notes,
        booking_id: record.booking_id
      };
    });

    // Then, overlay booking information
    bookings.forEach(booking => {
      console.log('Processing booking:', booking);
      const start = new Date(booking.check_in_date);
      const end = new Date(booking.check_out_date);
      console.log('Parsed dates:', { start, end });
      const dates = eachDayOfInterval({ start, end });
      
      dates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        availabilityMap[dateStr] = {
          ...availabilityMap[dateStr],
          status: 'occupied',
          reason: 'booked',
          booking_id: booking.id
        };
      });
    });

    console.log('Final availability map:', availabilityMap);

    const responseData = {
      status: 'success',
      data: {
        default_price: defaultPrice,
        availability: availabilityMap
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
    const {
      name,
      description,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities
    } = req.body;

    // Check if room exists
    const room = await getRoomHelper(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    // Update room
    await db.query(`
      UPDATE rooms
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_per_night = COALESCE(?, price_per_night),
        max_guests = COALESCE(?, max_guests),
        bedrooms = COALESCE(?, bedrooms),
        bathrooms = COALESCE(?, bathrooms),
        amenities = COALESCE(?, amenities),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      description,
      pricePerNight,
      maxGuests,
      bedrooms,
      bathrooms,
      amenities ? JSON.stringify(amenities) : null,
      roomId
    ]);

    res.json({
      status: 'success',
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update room'
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Check if room exists
    const room = await getRoomHelper(roomId);
    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    // Delete room
    await db.query('DELETE FROM rooms WHERE id = ?', [roomId]);

    res.json({
      status: 'success',
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete room'
    });
  }
};

const getRoomHelper = async (roomId) => {
  const [rooms] = await db.query(`
    SELECT 
      r.*,
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

  return rooms[0];
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

    // Check if dates are available
    const [existingBookings] = await db.query(`
      SELECT id 
      FROM bookings 
      WHERE room_id = ? 
      AND status = 'confirmed'
      AND (
        (check_in_date <= ? AND check_out_date > ?)
        OR
        (check_in_date < ? AND check_out_date >= ?)
        OR
        (check_in_date >= ? AND check_out_date <= ?)
      )
    `, [
      roomId,
      checkOutDate,
      checkInDate,
      checkOutDate,
      checkOutDate,
      checkInDate,
      checkOutDate
    ]);

    if (existingBookings.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Room is not available for the selected dates'
      });
    }

    // Generate a unique booking reference
    const bookingReference = uuidv4();

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
