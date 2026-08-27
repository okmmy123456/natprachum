import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);
router.use(requirePermission('settings.view'));

router.get('/', ConfigController.getAll);
router.put('/', requirePermission('settings.manage'), ConfigController.update);

export default router;
