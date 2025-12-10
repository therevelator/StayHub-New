import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import propertyRoutes from './routes/property.routes.js';
import roomRoutes from './routes/room.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import bodyParser from 'body-parser';
import ownerRoutes from './routes/owner.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  credentials: true
}));

// Log endpoint for client-side events
app.post('/api/logs', (req, res) => {
  const { type, content } = req.body;
  console.log(`\n\n[CLIENT LOG] ${type}:`);
  console.log('----------------------------------------');
  console.log(typeof content === 'object' ? JSON.stringify(content, null, 2) : content);
  console.log('----------------------------------------\n');
  res.status(200).send('Logged');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties', roomRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

export default app;