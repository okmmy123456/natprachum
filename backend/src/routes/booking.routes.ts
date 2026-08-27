import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createBookingValidator, guestBookingValidator, updateBookingValidator } from '../validators/booking.validator';

const router = Router();

// Guest booking (no auth required)
router.post('/guest', guestBookingValidator, validate, BookingController.guestBooking);
router.post('/guest/pdf', BookingController.guestFoodPdf);

// Protected routes
router.get('/', authenticate, BookingController.getAll);
router.get('/:id', authenticate, BookingController.getById);
router.post('/', authenticate, requirePermission('bookings.create'), createBookingValidator, validate, BookingController.create);
router.put('/:id', authenticate, updateBookingValidator, validate, BookingController.update);
router.put('/:id/cancel', authenticate, BookingController.cancel);
router.delete('/:id', authenticate, BookingController.delete);

export default router;
