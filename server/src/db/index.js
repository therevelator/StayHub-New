import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

const pool = mysql.createPool({
  ...config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
