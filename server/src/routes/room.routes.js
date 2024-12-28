import express from 'express';
import * as roomController from '../controllers/room.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import checkPropertyOwnership from '../middleware/checkPropertyOwnership.js';

const router = express.Router();

// Create a new room for a property
router.post('/properties/:propertyId/rooms', 
  authenticateToken,
  checkPropertyOwnership,
  roomController.createRoom
);

// Get all rooms for a property
router.get('/properties/:propertyId/rooms',
  roomController.getRooms
);

// Get a specific room
router.get('/properties/rooms/:roomId',
  roomController.getRoom
);

// Update a room
router.put('/properties/rooms/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.updateRoom
);

// Delete a room
router.delete('/properties/rooms/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.deleteRoom
);

// Get room availability
router.get('/properties/rooms/:roomId/availability', roomController.getRoomAvailability);

// Create a booking
router.post('/properties/rooms/:roomId/book', authenticateToken, roomController.createBooking);

export default router;
