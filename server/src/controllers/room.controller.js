import db from '../db/index.js';
import * as propertyModel from '../models/property.model.js';
import * as roomModel from '../models/room.model.js';
import { v4 as uuidv4 } from 'uuid';

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
    const { roomId } = req.params;
    console.log('Checking availability for roomId:', roomId);
    
    const room = await getRoomHelper(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }
    
    // Get all confirmed bookings for this room
    const [bookings] = await db.query(`
      SELECT 
        DATE(check_in_date) as check_in_date, 
        DATE(check_out_date) as check_out_date,
        status 
      FROM bookings 
      WHERE room_id = ? 
      AND status = 'confirmed'
      AND check_out_date >= CURDATE()
    `, [roomId]);

    console.log('Found bookings:', bookings);

    const bookingDates = new Set();

    // Mark all dates between check-in and check-out as booked
    bookings.forEach(booking => {
      // Create new Date objects from the database dates
      const checkInDate = new Date(booking.check_in_date);
      const checkOutDate = new Date(booking.check_out_date);

      console.log('Processing booking:', {
        checkIn: checkInDate.toISOString().split('T')[0],
        checkOut: checkOutDate.toISOString().split('T')[0]
      });

      // Add dates from check-in up to (but not including) check-out
      let currentDate = new Date(checkInDate);
      while (currentDate < checkOutDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        bookingDates.add(dateString);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const bookedDates = Array.from(bookingDates).sort();
    console.log('Booked dates:', bookedDates);

    // Generate available dates (next 90 days)
    const availableDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      if (!bookingDates.has(dateString)) {
        availableDates.push(dateString);
      }
    }

    const response = {
      status: 'success',
      availableDates,
      bookingDates: bookedDates
    };

    console.log('Sending response:', response);
    res.json(response);

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
    console.log('Creating booking for user:', userId); // Debug log

    // Get room details to calculate total price
    const [rooms] = await db.query('SELECT base_price FROM rooms WHERE id = ?', [roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    const room = rooms[0];
    
    // Calculate number of nights
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const numberOfNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate total price
    const totalPrice = room.base_price * numberOfNights;

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
      totalPrice,
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
        checkOutDate
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
