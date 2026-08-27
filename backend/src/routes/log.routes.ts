import { Router } from 'express';
import { ActivityLogController } from '../controllers/activitylog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

// Get activity logs (SuperAdmin only)
router.get('/activity', requirePermission('activitylogs.view'), ActivityLogController.getAll);

export default router;
