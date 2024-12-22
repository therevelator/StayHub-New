import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import bcrypt from 'bcrypt';

const generateToken = (user) => {
  return jwt.sign({ 
    id: user.id,
    role: user.role
  }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

export const register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    console.log('Existing user check:', existingUser);
    
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered',
      });
    }

    // Create new user
    console.log('Creating new user...');
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });
    console.log('User created:', user);

    // Create user profile and security settings
    await Promise.all([
      User.createProfile(user.id, {
        language: 'en',
        currency: 'USD',
        notifications: { email: true, push: false },
      }),
      User.createSecuritySettings(user.id),
    ]);

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
          role: user.role
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user account',
      details: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    
    console.log('Login attempt - Full user data:', user);

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      };

      console.log('Sending user data:', userData);

      const token = generateToken(user);

      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};
