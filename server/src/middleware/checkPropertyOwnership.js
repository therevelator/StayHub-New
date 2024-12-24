import { getPropertyById } from '../models/property.model.js';
import db from '../db/index.js';

const checkPropertyOwnership = async (req, res, next) => {
  try {
    let propertyId = req.params.propertyId;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    
    console.log('Checking ownership - User ID:', userId);
    console.log('Is Admin:', isAdmin);
    console.log('Property ID:', propertyId);
    console.log('Room ID:', req.params.roomId);
    console.log('User object:', req.user);

    if (!userId) {
      console.log('No user ID found in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // If user is admin, allow all operations
    if (isAdmin) {
      console.log('Admin access granted');
      return next();
    }

    // If we're dealing with a room operation, get the property ID from the room
    if (req.params.roomId && !propertyId) {
      console.log('Getting property ID from room:', req.params.roomId);
      const [rooms] = await db.query(
        'SELECT property_id FROM rooms WHERE id = ?', 
        [req.params.roomId]
      );
      
      if (rooms.length === 0) {
        return res.status(404).json({ message: 'Room not found' });
      }
      propertyId = rooms[0].property_id;
      console.log('Found Property ID from room:', propertyId);
    }

    // Get property details
    const [property] = await db.query(
      'SELECT host_id FROM properties WHERE id = ?',
      [propertyId]
    );

    if (property.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if user is the property owner
    if (property[0].host_id !== userId) {
      console.log('User is not property owner. Host ID:', property[0].host_id, 'User ID:', userId);
      return res.status(403).json({ message: 'Not authorized to modify this property' });
    }

    next();
  } catch (error) {
    console.error('Error in checkPropertyOwnership:', error);
    res.status(500).json({ message: 'Server error checking property ownership' });
  }
};

export default checkPropertyOwnership;
