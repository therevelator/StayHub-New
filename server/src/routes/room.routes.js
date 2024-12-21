import express from 'express';
import * as roomController from '../controllers/room.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import checkPropertyOwnership from '../middleware/checkPropertyOwnership.js';

const router = express.Router();

// Create a new room for a property
router.post('/:propertyId', 
  authenticateToken,
  checkPropertyOwnership,
  roomController.createRoom
);

// Get all rooms for a property
router.get('/property/:propertyId',
  roomController.getRooms
);

// Get a specific room
router.get('/:roomId',
  roomController.getRoom
);

// Update a room
router.put('/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.updateRoom
);

// Delete a room
router.delete('/:roomId',
  authenticateToken,
  checkPropertyOwnership,
  roomController.deleteRoom
);

export default router;
