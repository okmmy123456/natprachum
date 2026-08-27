import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);
router.use(requireRole('SuperAdmin', 'Admin'));

router.get('/', RoleController.getAll);
router.get('/permissions', RoleController.getAllPermissions);
router.get('/:id', RoleController.getById);
router.post('/', RoleController.create);
router.put('/:id', RoleController.update);
router.delete('/:id', RoleController.delete);
router.put('/:id/permissions', RoleController.updatePermissions);

export default router;
