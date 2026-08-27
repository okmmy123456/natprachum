import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole, requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createUserValidator, updateUserValidator, changeRoleValidator, resetUserPasswordValidator } from '../validators/user.validator';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('users.view'), UserController.getAll);
router.get('/:id', requirePermission('users.view'), UserController.getById);
router.post('/', requirePermission('users.create'), createUserValidator, validate, UserController.create);
router.put('/:id', requirePermission('users.edit'), updateUserValidator, validate, UserController.update);
router.delete('/:id', requirePermission('users.delete'), UserController.deactivate);
router.put('/:id/role', requireRole('SuperAdmin'), changeRoleValidator, validate, UserController.changeRole);
router.put('/:id/reset-password', requireRole('SuperAdmin', 'Admin'), resetUserPasswordValidator, validate, UserController.resetPassword);
router.get('/:id/bookings', UserController.getBookingHistory);

export default router;
