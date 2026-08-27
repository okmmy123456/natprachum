import { Request, Response, NextFunction } from 'express';
import { ActivityLogService } from '../services/activitylog.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export class ActivityLogController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ActivityLogService.getAll(req.query);
      sendSuccess(res, result, 'Activity logs retrieved successfully');
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.message, error.statusCode);
      } else {
        next(error);
      }
    }
  }
}
