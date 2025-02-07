import express from 'express';
import { getGuestBookings, updateBooking, cancelBooking } from '../controllers/booking.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get guest's bookings
router.get('/guest', getGuestBookings);

// Update a booking
router.put('/:id', updateBooking);

// Cancel a booking
router.post('/:id/cancel', cancelBooking);

export default router;
