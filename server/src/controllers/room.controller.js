import db from '../db/index.js';
import * as propertyModel from '../models/property.model.js';
import * as roomModel from '../models/room.model.js';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const property = await propertyModel.getPropertyById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    console.log('Request body:', req.body);
    const result = await roomModel.createRoom(propertyId, req.body);
    
    res.status(201).json({
      message: 'Room created successfully',
      room: result
    });
  } catch (error) {
    console.error('Error in createRoom controller:', error);
    res.status(500).json({ message: 'Error creating room', error: error.message });
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

export const getRoom = async (req, res) => {
  try {
    const [rooms] = await db.query('SELECT * FROM rooms WHERE id = ?', [req.params.roomId]);
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Parse beds JSON if it exists
    const room = rooms[0];
    try {
      room.beds = JSON.parse(room.beds);
      room.amenities = JSON.parse(room.amenities);
      room.accessibility_features = JSON.parse(room.accessibility_features);
      room.climate = JSON.parse(room.climate);
      room.images = JSON.parse(room.images);
      room.energy_saving_features = JSON.parse(room.energy_saving_features);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
    
    res.json({
      status: 'success',
      data: room
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching room', 
      error: error.message 
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    console.log('Received update data:', req.body);
    
    // Map frontend fields to database fields and remove timestamps
    const { 
      created_at,
      updated_at,
      id,
      ...otherData 
    } = req.body;

    const updateData = {
      ...otherData,
      beds: typeof req.body.beds === 'string' ? req.body.beds : JSON.stringify(req.body.beds),
      amenities: typeof req.body.amenities === 'string' ? req.body.amenities : JSON.stringify(req.body.amenities),
      accessibility_features: typeof req.body.accessibility_features === 'string' ? req.body.accessibility_features : JSON.stringify(req.body.accessibility_features),
      climate: typeof req.body.climate === 'string' ? req.body.climate : JSON.stringify(req.body.climate),
      images: typeof req.body.images === 'string' ? req.body.images : JSON.stringify(req.body.images),
      energy_saving_features: typeof req.body.energy_saving_features === 'string' ? req.body.energy_saving_features : JSON.stringify(req.body.energy_saving_features),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Remove any undefined or null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    console.log('Final update data:', updateData);

    await db.query('UPDATE rooms SET ? WHERE id = ?', [updateData, roomId]);
    
    // Fetch and return the updated room
    const [updatedRoom] = await db.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (updatedRoom.length === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Room not found after update' 
      });
    }

    // Parse JSON fields in response
    try {
      updatedRoom[0].beds = JSON.parse(updatedRoom[0].beds);
      updatedRoom[0].amenities = JSON.parse(updatedRoom[0].amenities);
      updatedRoom[0].accessibility_features = JSON.parse(updatedRoom[0].accessibility_features);
      updatedRoom[0].climate = JSON.parse(updatedRoom[0].climate);
      updatedRoom[0].images = JSON.parse(updatedRoom[0].images);
      updatedRoom[0].energy_saving_features = JSON.parse(updatedRoom[0].energy_saving_features);
    } catch (e) {
      console.error('Error parsing JSON in response:', e);
    }

    res.json({
      status: 'success',
      data: updatedRoom[0]
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error updating room', 
      error: error.message 
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const [result] = await db.query('DELETE FROM rooms WHERE id = ?', [roomId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting room',
      error: error.message
    });
  }
};

export const getRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Get all confirmed bookings for this room
    const [bookings] = await db.query(`
      SELECT check_in_date, check_out_date 
      FROM bookings 
      WHERE room_id = ? 
      AND status = 'confirmed'
      AND check_out_date >= CURDATE()
    `, [roomId]);

    // Generate the next 90 days
    const availableDates = [];
    const bookedDates = new Set();

    // Mark all dates between check-in and check-out as booked
    bookings.forEach(booking => {
      let currentDate = new Date(booking.check_in_date);
      const checkOutDate = new Date(booking.check_out_date);
      
      while (currentDate < checkOutDate) {
        bookedDates.add(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Generate available dates (next 90 days)
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      if (!bookedDates.has(dateString)) {
        availableDates.push(dateString);
      }
    }

    res.json({
      status: 'success',
      availableDates,
      bookedDates: Array.from(bookedDates)
    });
  } catch (error) {
    console.error('Error getting room availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get room availability'
    });
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
        (check_in_date <= ? AND check_out_date > ?) OR
        (check_in_date < ? AND check_out_date >= ?) OR
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
      message: error.message || 'Failed to create booking'
    });
  }
};
