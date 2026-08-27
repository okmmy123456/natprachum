import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { RoleService } from '../services/role.service';
import { sendSuccess, sendError } from '../utils/response';

export class RoleController {
  static async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.getAll()); } catch (error) { next(error); }
  }
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.getById(parseInt(req.params.id))); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.create(req.body, req.user?.id), 'Role created', 201); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.update(parseInt(req.params.id), req.body, req.user?.id), 'Role updated'); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.delete(parseInt(req.params.id), req.user?.id)); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async updatePermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.updatePermissions(parseInt(req.params.id), req.body.permission_ids, req.user?.id), 'Permissions updated'); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async getAllPermissions(_req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoleService.getAllPermissions()); } catch (error) { next(error); }
  }
}
