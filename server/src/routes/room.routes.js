import express from 'express';
import * as roomController from '../controllers/room.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import checkPropertyOwnership from '../middleware/checkPropertyOwnership.js';

const router = express.Router();

// Public endpoints
router.get('/rooms/:roomId', roomController.getRoom);
router.get('/rooms/:roomId/availability', roomController.getRoomAvailability);
router.get('/:propertyId/rooms', roomController.getRooms);

// Protected endpoints
router.post('/:propertyId/rooms', 
  authenticateToken,
  checkPropertyOwnership,
  roomController.createRoom
);

router.put('/rooms/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.updateRoom
);

router.delete('/rooms/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.deleteRoom
);

router.post('/rooms/:roomId/book', 
  authenticateToken, 
  roomController.createBooking
);

export default router;
