import express from 'express';
import { authenticateToken, checkPropertyOwnership } from '../middleware/auth.middleware.js';
import * as calendarController from '../controllers/calendar.controller.js';
import * as maintenanceController from '../controllers/maintenance.controller.js';
import * as messageController from '../controllers/message.controller.js';
import * as financialController from '../controllers/financial.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import { getOwnerProperties, getPropertyBookings, updateBookingStatus, updateBooking, cancelBooking } from '../controllers/property.controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Property Owner Routes
router.get('/properties', getOwnerProperties);
router.get('/properties/:propertyId/bookings', checkPropertyOwnership, getPropertyBookings);
router.patch('/bookings/:bookingId/status', updateBookingStatus);
router.put('/bookings/:bookingId', updateBooking);
router.post('/bookings/:bookingId/cancel', cancelBooking);

// Analytics Routes
router.get('/properties/:propertyId/analytics', checkPropertyOwnership, analyticsController.getPropertyAnalytics);
router.get('/properties/:propertyId/analytics/revenue', checkPropertyOwnership, analyticsController.getRevenueAnalytics);
router.get('/properties/:propertyId/analytics/bookings', checkPropertyOwnership, analyticsController.getBookingAnalytics);
router.get('/properties/:propertyId/analytics/occupancy', checkPropertyOwnership, analyticsController.getOccupancyAnalytics);

// Calendar Management Routes
router.get('/properties/:propertyId/blocked-dates', checkPropertyOwnership, calendarController.getBlockedDates);
router.post('/properties/:propertyId/block-dates', checkPropertyOwnership, calendarController.blockDates);
router.delete('/blocked-dates/:blockId', checkPropertyOwnership, calendarController.unblockDates);

// Maintenance Routes
router.get('/properties/:propertyId/maintenance', checkPropertyOwnership, maintenanceController.getMaintenanceTasks);
router.post('/properties/:propertyId/maintenance', checkPropertyOwnership, maintenanceController.createMaintenanceTask);
router.patch('/maintenance/:taskId/status', checkPropertyOwnership, maintenanceController.updateTaskStatus);
router.delete('/maintenance/:taskId', checkPropertyOwnership, maintenanceController.deleteTask);

// Messaging Routes
router.get('/bookings/:bookingId/messages', messageController.getBookingMessages);
router.post('/bookings/:bookingId/messages', messageController.sendMessage);
router.patch('/bookings/:bookingId/messages/read', messageController.markMessagesAsRead);
router.get('/messages/unread', messageController.getUnreadCount);

// Financial Routes
router.get('/properties/:propertyId/transactions', checkPropertyOwnership, financialController.getPropertyTransactions);
router.post('/transactions', checkPropertyOwnership, financialController.createTransaction);
router.patch('/transactions/:transactionId/status', checkPropertyOwnership, financialController.updateTransactionStatus);

// Seasonal Pricing Routes
router.get('/rooms/:roomId/seasonal-pricing', checkPropertyOwnership, financialController.getSeasonalPricing);
router.post('/rooms/:roomId/seasonal-pricing', checkPropertyOwnership, financialController.setSeasonalPricing);
router.delete('/seasonal-pricing/:pricingId', checkPropertyOwnership, financialController.deleteSeasonalPricing);

export default router; 