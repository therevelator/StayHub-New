import db from '../config/database.js';

export const getUserById = async (id) => {
  try {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await db.query(query, [id]);
    return rows[0];
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  const { email, password, firstName, lastName, phoneNumber } = userData;
  
  try {
    const query = `
      INSERT INTO users (email, password, first_name, last_name, phone_number)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [email, password, firstName, lastName, phoneNumber]);
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.query(query, [email]);
    return rows[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};
