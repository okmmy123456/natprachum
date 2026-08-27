import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);
router.use(requirePermission('reports.view'));

router.get('/:type', ReportController.getReport);
router.get('/:type/export', requirePermission('reports.export'), ReportController.exportReport);

export default router;
