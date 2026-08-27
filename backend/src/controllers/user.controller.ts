import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UserService } from '../services/user.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { logActivity } from '../services/activitylog.service';
import { getClientIP } from '../utils/helpers';

export class UserController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getAll(req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) { next(error); }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getById(parseInt(req.params.id));
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.create(req.body, req.user?.id);
      await logActivity({ user_id: req.user?.id, action: 'CREATE_USER', module: 'users', description: `Created user ${req.body.username}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'User created', 201);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.update(parseInt(req.params.id), req.body, req.user?.id);
      sendSuccess(res, result, 'User updated');
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.deactivate(parseInt(req.params.id), req.user?.id);
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async changeRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.changeRole(parseInt(req.params.id), req.body.role_id, req.user?.id);
      sendSuccess(res, result, 'Role updated');
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.resetPassword(parseInt(req.params.id), req.body.new_password, req.user?.id);
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async getBookingHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id) || req.user!.id;
      const result = await UserService.getBookingHistory(userId, req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) { next(error); }
  }
}
