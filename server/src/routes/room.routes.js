import express from 'express';
import * as roomController from '../controllers/room.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import checkPropertyOwnership from '../middleware/checkPropertyOwnership.js';

const router = express.Router();

// Public endpoints
router.get('/:propertyId/rooms/:roomId', roomController.getRoom);
router.get('/:propertyId/rooms/:roomId/availability', roomController.getRoomAvailability);
router.get('/:propertyId/rooms/:roomId/reservations', roomController.getRoomReservations);
router.get('/:propertyId/rooms', roomController.getRooms);

// Protected endpoints
router.post('/:propertyId/rooms', 
  authenticateToken,
  checkPropertyOwnership,
  roomController.createRoom
);

router.put('/:propertyId/rooms/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.updateRoom
);

router.delete('/:propertyId/rooms/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.deleteRoom
);

router.post('/:propertyId/rooms/:roomId/book', 
  authenticateToken, 
  roomController.createBooking
);

// Add room availability endpoint
router.post('/:propertyId/rooms/:roomId/availability',
  authenticateToken,
  checkPropertyOwnership,
  roomController.updateRoomAvailability
);

export default router;
