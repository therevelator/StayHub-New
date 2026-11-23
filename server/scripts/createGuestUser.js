import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../src/config/database.js';

const createGuestUser = async () => {
  try {
    const password = 'L3v75th5n!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await db.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, 'guest@123.com', hashedPassword, 'Guest', 'User', 'guest', 'active']
    );

    console.log('Guest user created successfully!');
    console.log('Email: guest@123.com');
    console.log('Password: L3v75th5n!');
  } catch (error) {
    console.error('Error creating guest user:', error);
  } finally {
    await db.end();
  }
};

createGuestUser();
