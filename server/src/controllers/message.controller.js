import db from '../db/index.js';

// Get messages for a booking
export const getBookingMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const [messages] = await db.query(
      `SELECT m.*,
        s.first_name as sender_first_name,
        s.last_name as sender_last_name,
        r.first_name as receiver_first_name,
        r.last_name as receiver_last_name
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.booking_id = ?
       ORDER BY m.created_at ASC`,
      [bookingId]
    );

    res.json({
      status: 'success',
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { message, receiverId } = req.body;
    const senderId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO messages 
       (booking_id, sender_id, receiver_id, message)
       VALUES (?, ?, ?, ?)`,
      [bookingId, senderId, receiverId, message]
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: result.insertId,
        booking_id: bookingId,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    await db.query(
      `UPDATE messages 
       SET is_read = TRUE
       WHERE booking_id = ? AND receiver_id = ? AND is_read = FALSE`,
      [bookingId, userId]
    );

    res.json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT COUNT(*) as count
       FROM messages
       WHERE receiver_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({
      status: 'success',
      data: {
        unreadCount: result[0].count
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread message count' });
  }
}; 