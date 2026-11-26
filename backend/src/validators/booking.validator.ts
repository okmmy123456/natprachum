import { body } from 'express-validator';

export const createBookingValidator = [
  body('booking_name').trim().notEmpty().withMessage('Booking name is required'),
  body('room_id').isInt().withMessage('Room is required'),
  body('participant_count').isInt({ min: 1 }).withMessage('Participant count must be at least 1'),
  body('booking_date').isISO8601().withMessage('Valid booking date is required'),
  body('end_date').optional({ values: 'falsy' }).isISO8601().withMessage('Valid end date is required'),
  body('skip_weekends').optional().isBoolean(),
  body('start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time is required (HH:mm)'),
  body('end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time is required (HH:mm)'),
  body('purpose').optional().trim(),
  body('additional_note').optional().trim(),
  body('phone_number').optional().trim(),
  body('food_order').optional().isObject().withMessage('Food order must be an object'),
  body('food_order.company_name').optional().trim(),
  body('food_order.welcome_sign_needed').optional().isBoolean(),
  body('food_order.welcome_sign_text').optional().trim(),
  body('food_order.snack_items').optional().isArray(),
  body('food_order.lunch_items').optional().isArray(),
  body('food_order.guest_diners').optional().isArray(),
  body('food_order.internal_diners').optional().isArray(),
  body('food_order.additional_notes').optional().trim(),
];

export const guestBookingValidator = [
  body('booking_name').trim().notEmpty().withMessage('Booking name is required'),
  body('guest_name').trim().notEmpty().withMessage('Guest name is required'),
  body('guest_email').trim().isEmail().withMessage('Valid guest email is required'),
  body('guest_phone').trim().notEmpty().withMessage('Guest phone number is required'),
  body('guest_company_id').optional().isInt().withMessage('Company ID must be an integer'),
  body('guest_department_code').optional().trim(),
  body('guest_department_name').optional().trim(),
  body('room_id').isInt().withMessage('Room is required'),
  body('participant_count').isInt({ min: 1 }).withMessage('Participant count must be at least 1'),
  body('booking_date').isISO8601().withMessage('Valid booking date is required'),
  body('end_date').optional({ values: 'falsy' }).isISO8601().withMessage('Valid end date is required'),
  body('skip_weekends').optional().isBoolean(),
  body('start_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time is required (HH:mm)'),
  body('end_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time is required (HH:mm)'),
  body('purpose').optional().trim(),
  body('food_order').optional().isObject().withMessage('Food order must be an object'),
  body('food_order.company_name').optional().trim(),
  body('food_order.welcome_sign_needed').optional().isBoolean(),
  body('food_order.welcome_sign_text').optional().trim(),
  body('food_order.snack_items').optional().isArray(),
  body('food_order.lunch_items').optional().isArray(),
  body('food_order.guest_diners').optional().isArray(),
  body('food_order.internal_diners').optional().isArray(),
  body('food_order.additional_notes').optional().trim(),
];

export const updateBookingValidator = [
  body('booking_name').optional().trim().notEmpty(),
  body('participant_count').optional().isInt({ min: 1 }),
  body('booking_date').optional().isISO8601(),
  body('start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('purpose').optional().trim(),
  body('additional_note').optional().trim(),
];

export const approvalValidator = [
  body('reject_reason').optional().trim(),
  body('cancel_reason').optional().trim(),
];
