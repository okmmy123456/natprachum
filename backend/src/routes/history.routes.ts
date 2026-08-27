import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';

const router = Router();

router.post('/request-otp', HistoryController.requestOtp);
router.post('/verify-otp', HistoryController.verifyOtp);
router.get('/bookings', HistoryController.getHistory);
router.get('/bookings/:id', HistoryController.getBooking);
router.put('/bookings/:id', HistoryController.updateBooking);
router.put('/bookings/:id/cancel', HistoryController.cancelBooking);
router.get('/food-orders/:id/pdf', HistoryController.exportFoodPdf);

export default router;
