import { Router } from 'express';
import { apiLimiter } from '../middleware/rateLimit.middleware';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import roleRoutes from './role.routes';
import roomRoutes from './room.routes';
import bookingRoutes from './booking.routes';
import approvalRoutes from './approval.routes';
import calendarRoutes from './calendar.routes';
import notificationRoutes from './notification.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import masterdataRoutes from './masterdata.routes';
import holidayRoutes from './holiday.routes';
import configRoutes from './config.routes';
import foodOrderRoutes from './foodorder.routes';
import historyRoutes from './history.routes';
import logRoutes from './log.routes';

const router = Router();

// Apply rate limiting to all API routes
router.use(apiLimiter);

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/approvals', approvalRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/master', masterdataRoutes);
router.use('/holidays', holidayRoutes);
router.use('/config', configRoutes);
router.use('/food-orders', foodOrderRoutes);
router.use('/history', historyRoutes);
router.use('/logs', logRoutes);

export default router;
