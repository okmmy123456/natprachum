import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ConfigService } from '../services/config.service';
import { sendSuccess, sendError } from '../utils/response';

export class ConfigController {
  static async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await ConfigService.getAll()); } catch (error) { next(error); }
  }
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { configs } = req.body;
      if (configs && Array.isArray(configs)) {
        const result = await ConfigService.bulkUpdate(configs, req.user?.id);
        sendSuccess(res, result, 'Settings updated');
      } else {
        const { config_key, config_value, config_type, description } = req.body;
        const result = await ConfigService.set(config_key, config_value, config_type, description, req.user?.id);
        sendSuccess(res, result, 'Setting updated');
      }
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
}
