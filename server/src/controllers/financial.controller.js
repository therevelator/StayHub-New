import db from '../db/index.js';

// Get financial transactions for a property
export const getPropertyTransactions = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const [transactions] = await db.query(
      `SELECT t.*,
        b.check_in_date,
        b.check_out_date,
        u.first_name,
        u.last_name,
        u.email
       FROM financial_transactions t
       LEFT JOIN bookings b ON t.booking_id = b.id
       LEFT JOIN users u ON b.user_id = u.id
       WHERE t.property_id = ?
       ORDER BY t.transaction_date DESC`,
      [propertyId]
    );

    res.json({
      status: 'success',
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// Create a new transaction
export const createTransaction = async (req, res) => {
  try {
    const {
      bookingId,
      propertyId,
      amount,
      type,
      description
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO financial_transactions 
       (booking_id, property_id, amount, type, description)
       VALUES (?, ?, ?, ?, ?)`,
      [bookingId, propertyId, amount, type, description]
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: result.insertId,
        booking_id: bookingId,
        property_id: propertyId,
        amount,
        type,
        description,
        status: 'pending',
        transaction_date: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
};

// Update transaction status
export const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status } = req.body;

    await db.query(
      'UPDATE financial_transactions SET status = ? WHERE id = ?',
      [status, transactionId]
    );

    res.json({
      status: 'success',
      message: 'Transaction status updated successfully'
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ message: 'Failed to update transaction status' });
  }
};

// Get seasonal pricing for a room
export const getSeasonalPricing = async (req, res) => {
  try {
    const { roomId } = req.params;
    const [pricing] = await db.query(
      `SELECT * FROM seasonal_pricing 
       WHERE room_id = ? 
       ORDER BY start_date`,
      [roomId]
    );

    res.json({
      status: 'success',
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching seasonal pricing:', error);
    res.status(500).json({ message: 'Failed to fetch seasonal pricing' });
  }
};

// Set seasonal pricing
export const setSeasonalPricing = async (req, res) => {
  try {
    const { roomId } = req.params;
    const {
      startDate,
      endDate,
      priceMultiplier,
      reason
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO seasonal_pricing 
       (room_id, start_date, end_date, price_multiplier, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [roomId, startDate, endDate, priceMultiplier, reason]
    );

    res.status(201).json({
      status: 'success',
      data: {
        id: result.insertId,
        room_id: roomId,
        start_date: startDate,
        end_date: endDate,
        price_multiplier: priceMultiplier,
        reason
      }
    });
  } catch (error) {
    console.error('Error setting seasonal pricing:', error);
    res.status(500).json({ message: 'Failed to set seasonal pricing' });
  }
};

// Delete seasonal pricing
export const deleteSeasonalPricing = async (req, res) => {
  try {
    const { pricingId } = req.params;

    await db.query(
      'DELETE FROM seasonal_pricing WHERE id = ?',
      [pricingId]
    );

    res.json({
      status: 'success',
      message: 'Seasonal pricing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting seasonal pricing:', error);
    res.status(500).json({ message: 'Failed to delete seasonal pricing' });
  }
}; 