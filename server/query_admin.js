import dotenv from 'dotenv';
import pool from './src/db/index.js';

dotenv.config();

const queryAdmin = async () => {
    try {
        const propertyId = 65;
        console.log(`Querying admin for property ID: ${propertyId}`);

        const query = `
      SELECT 
        p.id as property_id,
        p.name as property_name,
        p.host_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM properties p
      LEFT JOIN users u ON p.host_id = u.id COLLATE utf8mb4_0900_ai_ci
      WHERE p.id = ?
    `;

        const [rows] = await pool.query(query, [propertyId]);

        if (rows.length > 0) {
            console.log('Property Admin Found:');
            console.log(JSON.stringify(rows[0], null, 2));
        } else {
            console.log('No property found with ID 65');
        }

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await pool.end();
        process.exit();
    }
};

queryAdmin();
