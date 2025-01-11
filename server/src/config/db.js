import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        connection.release();
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
};

testConnection();

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export { pool };
