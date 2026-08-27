import { Router } from 'express';
import { FoodOrderController } from '../controllers/foodorder.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

// Get pending food orders for approval (Manager/Admin)
router.get('/pending', requirePermission('food_orders.approve'), FoodOrderController.getPending);

// Get food order by booking ID
router.get('/booking/:bookingId', FoodOrderController.getByBooking);

// Create food order
router.post('/', requirePermission('bookings.create'), FoodOrderController.create);

// Approve food order
router.put('/:id/approve', requirePermission('food_orders.approve'), FoodOrderController.approve);

// Reject food order
router.put('/:id/reject', requirePermission('food_orders.approve'), FoodOrderController.reject);

// Export PDF
router.get('/:id/pdf', FoodOrderController.exportPDF);

export default router;
