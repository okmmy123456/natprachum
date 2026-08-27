import { Router } from 'express';
import { HolidayController } from '../controllers/masterdata.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { holidayValidator } from '../validators/common.validator';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('holidays.view'), HolidayController.getAll);
router.get('/:id', requirePermission('holidays.view'), HolidayController.getById);
router.post('/', requirePermission('holidays.manage'), holidayValidator, validate, HolidayController.create);
router.put('/:id', requirePermission('holidays.manage'), HolidayController.update);
router.delete('/:id', requirePermission('holidays.manage'), HolidayController.delete);

export default router;
