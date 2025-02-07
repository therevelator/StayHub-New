import express from 'express';
import { getAllUsers, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Admin routes - protected by authentication and admin middleware
router.get('/', authenticateToken, (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, getAllUsers);

router.put('/:id', authenticateToken, (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, updateUser);

router.delete('/:id', authenticateToken, (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, deleteUser);

export default router;
