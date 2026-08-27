import { body } from 'express-validator';

export const registerValidator = [
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 100 }).withMessage('Username must be 3-100 characters'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('mobile_phone').optional().trim(),
  body('office_phone').optional().trim(),
  body('company_id').optional().isInt(),
  body('site_id').optional().isInt(), body('site').optional().trim(),
  body('department_id').optional().isInt(),
  body('department_code').optional().trim(),
  body('department_name').optional().trim(),
  body('position').optional().trim(),
];

export const loginValidator = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
];

export const verifyOtpValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('otp_code').trim().notEmpty().withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('type').notEmpty().withMessage('OTP type is required'),
];

export const resetPasswordValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('otp_code').trim().notEmpty().withMessage('OTP code is required'),
  body('new_password').notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const changePasswordValidator = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const updateProfileValidator = [
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('mobile_phone').optional().trim(),
  body('office_phone').optional().trim(),
  body('company_id').optional().isInt(),
  body('site_id').optional().isInt(), body('site').optional().trim(),
  body('department_id').optional().isInt(),
];
