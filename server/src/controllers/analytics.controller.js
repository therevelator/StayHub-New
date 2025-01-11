import { pool } from '../config/db.js';

export const getPropertyAnalytics = async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const query = `
            SELECT 
                COUNT(DISTINCT b.id) as total_bookings,
                COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as completed_bookings,
                COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
                IFNULL(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_price END), 0) as total_revenue,
                AVG(CASE WHEN b.status = 'confirmed' THEN b.total_price END) as average_booking_value
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE r.property_id = ?
            AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;
        
        const [result] = await pool.query(query, [propertyId]);
        res.json(result[0]);
    } catch (error) {
        console.error('Error fetching property analytics:', error);
        res.status(500).json({ message: 'Error fetching property analytics' });
    }
};

export const getRevenueAnalytics = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { period = '30days' } = req.query;
        
        let interval;
        switch (period) {
            case '7days':
                interval = 7;
                break;
            case '90days':
                interval = 90;
                break;
            default:
                interval = 30;
        }
        
        const query = `
            SELECT 
                DATE(b.check_in_date) as date,
                COUNT(b.id) as bookings_count,
                SUM(b.total_price) as revenue
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE r.property_id = ?
            AND b.status = 'confirmed'
            AND b.check_in_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(b.check_in_date)
            ORDER BY date ASC
        `;
        
        const [result] = await pool.query(query, [propertyId, interval]);
        res.json(result);
    } catch (error) {
        console.error('Error fetching revenue analytics:', error);
        res.status(500).json({ message: 'Error fetching revenue analytics' });
    }
};

export const getBookingAnalytics = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { period = '30days' } = req.query;
        
        let interval;
        switch (period) {
            case '7days':
                interval = 7;
                break;
            case '90days':
                interval = 90;
                break;
            default:
                interval = 30;
        }
        
        const query = `
            SELECT 
                DATE(b.created_at) as date,
                COUNT(b.id) as total_bookings,
                COUNT(CASE WHEN b.status = 'confirmed' THEN b.id END) as completed_bookings,
                COUNT(CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE r.property_id = ?
            AND b.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(b.created_at)
            ORDER BY date ASC
        `;
        
        const [result] = await pool.query(query, [propertyId, interval]);
        res.json(result);
    } catch (error) {
        console.error('Error fetching booking analytics:', error);
        res.status(500).json({ message: 'Error fetching booking analytics' });
    }
};

export const getOccupancyAnalytics = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { period = '30days' } = req.query;
        
        let interval;
        switch (period) {
            case '7days':
                interval = 7;
                break;
            case '90days':
                interval = 90;
                break;
            default:
                interval = 30;
        }
        
        const query = `
            WITH RECURSIVE dates AS (
                SELECT CURDATE() as date
                UNION ALL
                SELECT date - INTERVAL 1 DAY
                FROM dates
                WHERE date > CURDATE() - INTERVAL ? DAY
            ),
            room_counts AS (
                SELECT COUNT(*) as total_rooms
                FROM rooms
                WHERE property_id = ?
            ),
            daily_bookings AS (
                SELECT 
                    d.date,
                    COUNT(DISTINCT b.room_id) as booked_rooms
                FROM dates d
                LEFT JOIN bookings b ON d.date BETWEEN b.check_in_date AND DATE_SUB(b.check_out_date, INTERVAL 1 DAY)
                    AND b.status = 'confirmed'
                LEFT JOIN rooms r ON b.room_id = r.id AND r.property_id = ?
                GROUP BY d.date
            )
            SELECT 
                db.date,
                IFNULL(db.booked_rooms, 0) as occupied_rooms,
                rc.total_rooms,
                ROUND((IFNULL(db.booked_rooms, 0) / NULLIF(rc.total_rooms, 0)) * 100, 2) as occupancy_rate
            FROM daily_bookings db
            CROSS JOIN room_counts rc
            ORDER BY db.date DESC
            LIMIT ?
        `;
        
        const [result] = await pool.query(query, [interval, propertyId, propertyId, interval]);
        res.json(result);
    } catch (error) {
        console.error('Error fetching occupancy analytics:', error);
        res.status(500).json({ message: 'Error fetching occupancy analytics' });
    }
};
