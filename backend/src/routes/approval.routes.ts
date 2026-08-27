import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

router.get('/badges', requirePermission('approvals.view'), ApprovalController.getBadges);
router.get('/pending-room', requirePermission('approvals.view'), ApprovalController.getPendingRooms);
router.get('/pending-equipment', requirePermission('approvals.view'), ApprovalController.getPendingEquipment);
router.put('/:id/approve', requirePermission('approvals.approve'), ApprovalController.approve);
router.put('/:id/reject', requirePermission('approvals.reject'), ApprovalController.reject);
router.put('/:id/equipment/approve', requirePermission('approvals.approve'), ApprovalController.approveEquipment);
router.put('/:id/equipment/reject', requirePermission('approvals.reject'), ApprovalController.rejectEquipment);

export default router;
