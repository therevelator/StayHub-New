import express from 'express';
import { 
  searchProperties, 
  getPropertyDetailsById, 
  createNewProperty, 
  updatePropertyById, 
  deletePropertyById,
  getAllProperties,
  updatePropertyStatus
} from '../controllers/property.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/search', searchProperties);
router.get('/:id', getPropertyDetailsById);

// Protected routes - require authentication
router.use(authenticateToken); // Apply authentication middleware to all routes below
router.get('/', getAllProperties);  // Add authentication here
router.post('/', createNewProperty);
router.put('/:id', updatePropertyById);
router.delete('/:id', deletePropertyById);
router.patch('/:id/status', updatePropertyStatus);

export default router;
