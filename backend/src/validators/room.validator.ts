import { body } from 'express-validator';

export const createRoomValidator = [
  body('room_name').trim().notEmpty().withMessage('Room name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('description').optional().trim(),
  body('owner_ids').optional().isArray(),
  body('equipment_ids').optional().isArray(),
];

export const updateRoomValidator = [
  body('room_name').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1 }),
  body('description').optional().trim(),
  body('owner_ids').optional().isArray(),
  body('equipment_ids').optional().isArray(),
];
