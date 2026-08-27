import { Router } from 'express';
import { MasterDataController } from '../controllers/masterdata.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
import { optionalAuth } from '../middleware/auth.middleware';

router.get('/:entity', optionalAuth, MasterDataController.getAll);
router.get('/:entity/:id', optionalAuth, MasterDataController.getById);
router.post('/:entity', authenticate, requirePermission('masterdata.manage'), MasterDataController.create);
router.put('/:entity/:id', authenticate, requirePermission('masterdata.manage'), MasterDataController.update);
router.delete('/:entity/:id', authenticate, requirePermission('masterdata.manage'), MasterDataController.delete);

export default router;
