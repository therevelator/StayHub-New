import { getPropertyById } from '../models/property.model.js';
import db from '../db/index.js';

const checkPropertyOwnership = async (req, res, next) => {
  try {
    let propertyId = req.params.propertyId;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';
    
    console.log('Checking ownership - User ID:', userId);
    console.log('Is Admin:', isAdmin);
    console.log('Initial Property ID:', propertyId);
    console.log('Room ID:', req.params.roomId);

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // If user is admin, allow all operations
    if (isAdmin) {
      console.log('Admin access granted');
      return next();
    }

    // If we're dealing with a room operation, get the property ID from the room
    if (req.params.roomId) {
      console.log('Getting property ID from room:', req.params.roomId);
      const [rooms] = await db.query('SELECT property_id FROM rooms WHERE id = ?', [req.params.roomId]);
      console.log('Room query result:', rooms);
      
      if (rooms.length === 0) {
        return res.status(404).json({ message: 'Room not found' });
      }
      propertyId = rooms[0].property_id;
      console.log('Found Property ID from room:', propertyId);
    }

    const property = await getPropertyById(propertyId);
    console.log('Property:', property);
    console.log('Property host_id:', property?.host_id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.host_id !== userId) {
      console.log('Access denied - Property host_id:', property.host_id, 'User ID:', userId);
      return res.status(403).json({ message: 'You do not have permission to modify this property' });
    }

    // Add property to request object for later use
    req.property = property;
    next();
  } catch (error) {
    console.error('Error checking property ownership:', error);
    res.status(500).json({ message: 'Error checking property ownership' });
  }
};

export default checkPropertyOwnership;
