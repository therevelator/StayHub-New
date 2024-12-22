import db from '../config/database.js';

export const createAvailabilityRecord = async (roomId, date, status, bookingId = null, notes = null) => {
  const [result] = await db.query(
    `INSERT INTO room_availability (room_id, date, status, booking_id, notes) 
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     status = VALUES(status),
     booking_id = VALUES(booking_id),
     notes = VALUES(notes)`,
    [roomId, date, status, bookingId, notes]
  );
  return result;
};

export const getAvailabilityForDateRange = async (roomId, startDate, endDate) => {
  const [availability] = await db.query(
    `SELECT date, status, booking_id, notes 
     FROM room_availability 
     WHERE room_id = ? 
     AND date BETWEEN ? AND ?
     ORDER BY date`,
    [roomId, startDate, endDate]
  );
  return availability;
};

export const updateAvailabilityStatus = async (roomId, date, status, bookingId = null, notes = null) => {
  const [result] = await db.query(
    `UPDATE room_availability 
     SET status = ?, booking_id = ?, notes = ?
     WHERE room_id = ? AND date = ?`,
    [status, bookingId, notes, roomId, date]
  );
  return result;
};

export const bulkUpdateAvailability = async (roomId, dateRange, status, bookingId = null, notes = null) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Generate dates within the range
    const [dates] = await connection.query(
      `WITH RECURSIVE date_sequence AS (
         SELECT ? as date
         UNION ALL
         SELECT date + INTERVAL 1 DAY
         FROM date_sequence
         WHERE date < ?
       )
       SELECT date FROM date_sequence`,
      [dateRange.startDate, dateRange.endDate]
    );

    // Bulk insert/update for all dates
    for (const { date } of dates) {
      await connection.query(
        `INSERT INTO room_availability (room_id, date, status, booking_id, notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         booking_id = VALUES(booking_id),
         notes = VALUES(notes)`,
        [roomId, date, status, bookingId, notes]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}; 