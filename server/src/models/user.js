import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

class User {
  static async create({ email, password, firstName, lastName, phoneNumber }) {
    try {
      console.log('Creating user with data:', { email, firstName, lastName, phoneNumber });
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      
      const [result] = await db.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, hashedPassword, firstName, lastName, phoneNumber]
      );
      
      const user = await this.findById(userId);
      console.log('User created successfully:', user);
      return user;
    } catch (error) {
      console.error('Error in User.create:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      console.log('Finding user by email:', email);
      const [rows] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      console.log('Found user by email:', rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Error in User.findByEmail:', error);
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      console.log('Finding user by id:', id);
      const [rows] = await db.query(
        'SELECT id, email, first_name, last_name, phone_number, created_at, email_verified FROM users WHERE id = ?',
        [id]
      );
      console.log('Find by id result:', rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Error in User.findById:', error);
      throw new Error(`Failed to find user by id: ${error.message}`);
    }
  }

  static async verifyPassword(password, hashedPassword) {
    try {
      if (!password || !hashedPassword) {
        console.error('Missing password or hashedPassword');
        return false;
      }
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error in User.verifyPassword:', error);
      throw new Error('Failed to verify password');
    }
  }

  static async updateLastLogin(userId) {
    try {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error in User.updateLastLogin:', error);
      throw new Error('Failed to update last login');
    }
  }

  static async createProfile(userId) {
    try {
      console.log('Creating profile for user:', userId);

      // First check if profile already exists
      const [existingProfile] = await db.query(
        'SELECT * FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      if (existingProfile.length > 0) {
        console.log('Profile already exists for user:', userId);
        return existingProfile[0];
      }

      const defaultProfile = {
        user_id: userId,
        notifications: JSON.stringify({ email: true, push: false })
      };

      const query = `
        INSERT INTO user_profiles (user_id, notifications)
        VALUES (?, ?)
      `;

      console.log('Executing query:', query);
      console.log('Query params:', [defaultProfile.user_id, defaultProfile.notifications]);

      const [result] = await db.query(query, [
        defaultProfile.user_id,
        defaultProfile.notifications
      ]);

      console.log('Insert result:', result);

      if (!result.affectedRows) {
        throw new Error('No rows were inserted');
      }

      return defaultProfile;
    } catch (error) {
      console.error('Error in createProfile:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Profile already exists for this user');
      }
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  static async createSecuritySettings(userId) {
    try {
      const [result] = await db.query(
        `INSERT INTO user_security (user_id, two_factor_enabled, last_password_change)
         VALUES (?, false, CURRENT_TIMESTAMP)`,
        [userId]
      );
      return result;
    } catch (error) {
      console.error('Error in User.createSecuritySettings:', error);
      throw new Error('Failed to create security settings');
    }
  }
}

export default User;
