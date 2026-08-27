import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { CalendarService } from '../services/calendar.service';
import { sendSuccess } from '../utils/response';

export class CalendarController {
  static async getEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const events = await CalendarService.getEvents(req.query);
      sendSuccess(res, events);
    } catch (error) { next(error); }
  }
}
