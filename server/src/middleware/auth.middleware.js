import jwt from 'jsonwebtoken';
import db from '../db/index.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const checkPropertyOwnership = async (req, res, next) => {
  try {
    const propertyId = req.params.propertyId;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if user is admin
    if (req.user.role === 'admin') {
      return next();
    }

    // Check property ownership
    const [property] = await db.query(
      'SELECT id FROM properties WHERE id = ? AND host_id = ?',
      [propertyId, userId]
    );

    if (property.length === 0) {
      return res.status(403).json({ message: 'Not authorized to access this property' });
    }

    next();
  } catch (error) {
    console.error('Error checking property ownership:', error);
    res.status(500).json({ message: 'Server error checking property ownership' });
  }
};

// Alias for authenticateToken to make it more semantic
export const checkAuth = authenticateToken;
