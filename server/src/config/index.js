import dotenv from 'dotenv';
dotenv.config();

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key'
  // Database settings live in ./database.js (DATABASE_URL or DB_* variables).
};
