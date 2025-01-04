import db from '../db/index.js';

// Get blocked dates for a property
export const getBlockedDates = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const [blockedDates] = await db.query(
      `SELECT * FROM blocked_dates 
       WHERE property_id = ? 
       ORDER BY start_date`,
      [propertyId]
    );

    res.json({
      status: 'success',
      data: blockedDates
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ message: 'Failed to fetch blocked dates' });
  }
};

// Block dates for a property
export const blockDates = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { roomId, startDate, endDate, reason, notes } = req.body;

    const [result] = await db.query(
      `INSERT INTO blocked_dates 
       (property_id, room_id, start_date, end_date, reason, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [propertyId, roomId, startDate, endDate, reason, notes]
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: result.insertId,
        property_id: propertyId,
        room_id: roomId,
        start_date: startDate,
        end_date: endDate,
        reason,
        notes
      }
    });
  } catch (error) {
    console.error('Error blocking dates:', error);
    res.status(500).json({ message: 'Failed to block dates' });
  }
};

// Remove blocked dates
export const unblockDates = async (req, res) => {
  try {
    const { blockId } = req.params;

    await db.query(
      'DELETE FROM blocked_dates WHERE id = ?',
      [blockId]
    );

    res.json({
      status: 'success',
      message: 'Dates unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking dates:', error);
    res.status(500).json({ message: 'Failed to unblock dates' });
  }
}; 