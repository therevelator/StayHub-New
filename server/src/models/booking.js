import { pool as db } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Booking = {
  findByGuestId: async (guestId) => {
    try {
      console.log('Fetching bookings for guest:', guestId);
      // First, get the raw room data to verify the beds field
      const [rooms] = await db.query(
        'SELECT id, beds FROM rooms WHERE id = 61',
        []
      );
      console.log('Direct room query result:', rooms);

      const [bookings] = await db.query(
        `SELECT b.*, 
                p.id as property_id,
                p.name as property_name, 
                CONCAT(p.city, ', ', p.country) as property_location,
                r.id as room_id,
                r.name,
                r.description,
                r.room_type,
                r.bed_type,
                r.beds as room_beds,
                r.max_occupancy,
                r.base_price,
                r.price_per_night,
                r.bathroom_type,
                r.view_type,
                r.has_private_bathroom,
                r.smoking,
                r.has_balcony,
                r.has_kitchen,
                r.has_minibar,
                r.includes_breakfast,
                r.extra_bed_available,
                r.pets_allowed,
                r.has_toiletries,
                r.has_towels_linens,
                r.has_room_service,
                r.amenities,
                r.accessibility_features,
                r.energy_saving_features,
                r.climate,
                r.images
         FROM bookings b
         JOIN rooms r ON b.room_id = r.id
         JOIN properties p ON r.property_id = p.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`,
        [guestId]
      );
      
      console.log('Full booking query result:', bookings[0]);
      
      console.log('Raw booking data:', bookings[0]);

      return bookings.map(booking => {
        console.log('Processing booking:', booking.id);
        console.log('Raw beds data:', booking.room_beds);
        
        // Parse JSON fields
        let beds = [];
        try {
          if (booking.room_beds) {
            beds = JSON.parse(booking.room_beds);
            console.log('Successfully parsed beds:', beds);
          } else {
            console.log('No beds data found in booking');
          }
        } catch (e) {
          console.error('Error parsing beds:', e, 'Raw value:', booking.room_beds);
        }
        
        let amenities = [];
        try {
          amenities = booking.amenities ? JSON.parse(booking.amenities) : [];
        } catch (e) {
          console.error('Error parsing amenities:', e);
        }
        
        let accessibility_features = [];
        try {
          accessibility_features = booking.accessibility_features ? JSON.parse(booking.accessibility_features) : [];
        } catch (e) {
          console.error('Error parsing accessibility_features:', e);
        }
        
        let energy_saving_features = [];
        try {
          energy_saving_features = booking.energy_saving_features ? JSON.parse(booking.energy_saving_features) : [];
        } catch (e) {
          console.error('Error parsing energy_saving_features:', e);
        }
        
        let climate = { type: 'ac', available: true };
        try {
          climate = booking.climate ? JSON.parse(booking.climate) : climate;
        } catch (e) {
          console.error('Error parsing climate:', e);
        }
        
        let images = [];
        try {
          images = booking.images ? JSON.parse(booking.images) : [];
        } catch (e) {
          console.error('Error parsing images:', e);
        }

        return {
          id: booking.id,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          total_price: booking.total_price,
          status: booking.status,
          booking_reference: booking.booking_reference,
          number_of_guests: booking.number_of_guests,
          special_requests: booking.special_requests,
          property_id: booking.property_id,
          room_id: booking.id,
          property: {
            name: booking.property_name,
            location: booking.property_location
          },
          room: {
            id: booking.room_id,
            name: booking.name,
            description: booking.description,
            room_type: booking.room_type,
            bed_type: booking.bed_type,
            beds: beds, // Make sure we use the parsed beds array
            max_occupancy: booking.max_occupancy,
            base_price: booking.base_price,
            price_per_night: booking.price_per_night,
            bathroom_type: booking.bathroom_type,
            view_type: booking.view_type,
            has_private_bathroom: Boolean(booking.has_private_bathroom),
            smoking: Boolean(booking.smoking),
            has_balcony: Boolean(booking.has_balcony),
            has_kitchen: Boolean(booking.has_kitchen),
            has_minibar: Boolean(booking.has_minibar),
            includes_breakfast: Boolean(booking.includes_breakfast),
            extra_bed_available: Boolean(booking.extra_bed_available),
            pets_allowed: Boolean(booking.pets_allowed),
            has_toiletries: Boolean(booking.has_toiletries),
            has_towels_linens: Boolean(booking.has_towels_linens),
            has_room_service: Boolean(booking.has_room_service),
            amenities,
            accessibility_features,
            energy_saving_features,
            climate,
            images
          }
        };
      });
    } catch (error) {
      console.error('Error in findByGuestId:', error);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const [bookings] = await db.query(
        'SELECT * FROM bookings WHERE id = ?',
        [id]
      );
      return bookings[0];
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  },

  update: async (id, bookingData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        checkInDate,
        checkOutDate,
        numberOfGuests,
        specialRequests,
        totalPrice
      } = bookingData;

      // Get the old booking to update room availability
      const [oldBooking] = await connection.query(
        'SELECT check_in_date, check_out_date, room_id FROM bookings WHERE id = ?',
        [id]
      );

      if (!oldBooking[0]) {
        throw new Error('Booking not found');
      }

      // Update the booking
      await connection.query(
        `UPDATE bookings 
         SET check_in_date = ?, 
             check_out_date = ?,
             number_of_guests = ?,
             special_requests = ?,
             total_price = ?
         WHERE id = ?`,
        [
          checkInDate,
          checkOutDate,
          numberOfGuests,
          specialRequests,
          totalPrice,
          id
        ]
      );

      // Clear availability for the old dates
      await connection.query(
        `UPDATE room_availability 
         SET status = 'available' 
         WHERE room_id = ? 
         AND date >= ? 
         AND date < ?`,
        [oldBooking[0].room_id, oldBooking[0].check_in_date, oldBooking[0].check_out_date]
      );

      // Set availability for the new dates
      await connection.query(
        `UPDATE room_availability 
         SET status = 'occupied' 
         WHERE room_id = ? 
         AND date >= ? 
         AND date < ?`,
        [oldBooking[0].room_id, checkInDate, checkOutDate]
      );

      await connection.commit();
      return await Booking.findById(id);
    } catch (error) {
      await connection.rollback();
      console.error('Error in update:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  cancel: async (id) => {
    try {
      await db.query(
        'UPDATE bookings SET status = ? WHERE id = ?',
        ['cancelled', id]
      );
      return true;
    } catch (error) {
      console.error('Error in cancel:', error);
      throw error;
    }
  },

  create: async (bookingData) => {
    try {
      const { guest_id, room_id, check_in, check_out, total_price } = bookingData;
      const id = uuidv4();
      
      await db.query(
        `INSERT INTO bookings (id, guest_id, room_id, check_in, check_out, total_price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, guest_id, room_id, check_in, check_out, total_price, 'confirmed']
      );
      
      return await Booking.findById(id);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }
};

export default Booking;
