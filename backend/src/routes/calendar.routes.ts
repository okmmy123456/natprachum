import { Router } from 'express';
import { CalendarController } from '../controllers/calendar.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();
router.get('/events', optionalAuth, CalendarController.getEvents);

export default router;
