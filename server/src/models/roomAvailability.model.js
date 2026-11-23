import db from '../config/database.js';

export const createAvailabilityRecord = async (roomId, date, status, bookingId = null, notes = null) => {
  const [result] = await db.query(
    `INSERT INTO room_availability (room_id, date, status, booking_id, notes) 
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (room_id, date) DO UPDATE SET
     status = EXCLUDED.status,
     booking_id = EXCLUDED.booking_id,
     notes = EXCLUDED.notes`,
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
      `SELECT to_char(d, 'YYYY-MM-DD') AS date
       FROM generate_series(?::date, ?::date, INTERVAL '1 day') AS d`,
      [dateRange.startDate, dateRange.endDate]
    );

    // Bulk insert/update for all dates
    for (const { date } of dates) {
      await connection.query(
        `INSERT INTO room_availability (room_id, date, status, booking_id, notes)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (room_id, date) DO UPDATE SET
         status = EXCLUDED.status,
         booking_id = EXCLUDED.booking_id,
         notes = EXCLUDED.notes`,
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