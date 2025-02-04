import db from '../db/index.js';

export const checkPropertyOwnership = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Check if the property exists and belongs to the user
    const [properties] = await db.query(
      'SELECT id FROM properties WHERE id = ? AND host_id = ?',
      [propertyId, userId]
    );

    if (properties.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to modify this property'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking property ownership:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify property ownership'
    });
  }
};
