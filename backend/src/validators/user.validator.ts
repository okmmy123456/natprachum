import { body } from 'express-validator';

export const createUserValidator = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('role_id').isInt().withMessage('Role is required'),
];

export const updateUserValidator = [
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('email').optional().trim().isEmail(),
  body('mobile_phone').optional().trim(),
  body('office_phone').optional().trim(),
  body('is_active').optional().isBoolean(),
];

export const changeRoleValidator = [
  body('role_id').isInt().withMessage('Role ID is required'),
];

export const resetUserPasswordValidator = [
  body('new_password').notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];
