import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export class DashboardController {
  static async getStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await DashboardService.getStats()); } catch (error) { next(error); }
  }
  static async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await DashboardService.getAnalytics(req.query)); } catch (error) { next(error); }
  }
}
