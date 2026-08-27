import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);
router.use(requirePermission('dashboard.view'));

router.get('/stats', DashboardController.getStats);
router.get('/analytics', DashboardController.getAnalytics);

export default router;
