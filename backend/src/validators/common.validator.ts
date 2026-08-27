import { body } from 'express-validator';

export const idParamValidator = [
  // ID validation via params is handled in controllers
];

export const masterDataValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name is required'),
  body('code').optional().trim().notEmpty().withMessage('Code is required'),
];

export const holidayValidator = [
  body('holiday_name').trim().notEmpty().withMessage('Holiday name is required'),
  body('holiday_date').isISO8601().withMessage('Valid date is required'),
  body('description').optional().trim(),
  body('is_recurring').optional().isBoolean(),
  body('allow_special_approval').optional().isBoolean(),
  body('company_id').optional().isInt(),
];

export const systemConfigValidator = [
  body('config_key').trim().notEmpty().withMessage('Config key is required'),
  body('config_value').notEmpty().withMessage('Config value is required'),
  body('config_type').optional().isIn(['string', 'number', 'boolean', 'json']),
  body('description').optional().trim(),
];
