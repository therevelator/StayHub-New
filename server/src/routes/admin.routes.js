import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply both authentication and admin check to all admin routes
router.use(authenticateToken, requireAdmin);

// ... rest of your admin routes 