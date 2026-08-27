import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { MasterDataService, HolidayService } from '../services/masterdata.service';
import { Company, Site, Department, Equipment } from '../models';
import { sendSuccess, sendError } from '../utils/response';

const modelMap: Record<string, any> = { companies: Company, sites: Site, departments: Department, equipments: Equipment };

export class MasterDataController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const model = modelMap[req.params.entity];
      if (!model) return sendError(res, 'Invalid entity', 400);
      sendSuccess(res, await MasterDataService.getAll(model, req.query));
    } catch (error) { next(error); }
  }
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const model = modelMap[req.params.entity];
      if (!model) return sendError(res, 'Invalid entity', 400);
      sendSuccess(res, await MasterDataService.getById(model, parseInt(req.params.id)));
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const model = modelMap[req.params.entity];
      if (!model) return sendError(res, 'Invalid entity', 400);
      sendSuccess(res, await MasterDataService.create(model, req.body, req.user?.id), 'Created', 201);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const model = modelMap[req.params.entity];
      if (!model) return sendError(res, 'Invalid entity', 400);
      sendSuccess(res, await MasterDataService.update(model, parseInt(req.params.id), req.body, req.user?.id), 'Updated');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const model = modelMap[req.params.entity];
      if (!model) return sendError(res, 'Invalid entity', 400);
      sendSuccess(res, await MasterDataService.delete(model, parseInt(req.params.id), req.user?.id));
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
}

export class HolidayController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await HolidayService.getAll(req.query)); } catch (error) { next(error); }
  }
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await HolidayService.getById(parseInt(req.params.id))); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await HolidayService.create(req.body, req.user?.id), 'Holiday created', 201); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await HolidayService.update(parseInt(req.params.id), req.body, req.user?.id), 'Holiday updated'); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await HolidayService.delete(parseInt(req.params.id), req.user?.id)); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
}
