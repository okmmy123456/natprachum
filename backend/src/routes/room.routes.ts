import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRoomValidator, updateRoomValidator } from '../validators/room.validator';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', optionalAuth, RoomController.getAll);
router.get('/:id', optionalAuth, RoomController.getById);
router.get('/:id/schedule', optionalAuth, RoomController.getSchedule);
router.get('/:id/qrcode', RoomController.getQRCode);

// Protected routes
router.post('/', authenticate, requirePermission('rooms.create'), createRoomValidator, validate, RoomController.create);
router.put('/:id', authenticate, requirePermission('rooms.edit'), updateRoomValidator, validate, RoomController.update);
router.delete('/:id', authenticate, requirePermission('rooms.delete'), RoomController.delete);
router.post('/:id/images', authenticate, requirePermission('rooms.edit'), upload.array('images', 10), RoomController.uploadImages);
router.delete('/:id/images/:imageId', authenticate, requirePermission('rooms.edit'), RoomController.deleteImage);
router.put('/:id/images/reorder', authenticate, requirePermission('rooms.edit'), RoomController.reorderImages);

export default router;
