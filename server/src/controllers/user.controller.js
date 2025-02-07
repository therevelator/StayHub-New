import db from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const query = 'SELECT id, email, first_name, last_name, phone_number, created_at FROM users';
    const [users] = await db.query(query);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, phoneNumber } = req.body;

  try {
    const query = `
      UPDATE users 
      SET email = ?, first_name = ?, last_name = ?, phone_number = ?
      WHERE id = ?
    `;
    await db.query(query, [email, firstName, lastName, phoneNumber, id]);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM users WHERE id = ?';
    await db.query(query, [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
