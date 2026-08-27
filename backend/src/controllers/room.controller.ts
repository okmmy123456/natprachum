import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { RoomService } from '../services/room.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { logActivity } from '../services/activitylog.service';
import { getClientIP } from '../utils/helpers';
import { getQRCodeDataURL } from '../services/qrcode.service';

export class RoomController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.getAll(req.query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) { next(error); }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await RoomService.getById(parseInt(req.params.id))); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { BookingService } = require('../services/booking.service');
      const schedule = await BookingService.getUpcomingSchedule(parseInt(req.params.id));
      sendSuccess(res, schedule);
    } catch (error: any) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.create(req.body, req.user?.id);
      await logActivity({ user_id: req.user?.id, action: 'CREATE_ROOM', module: 'rooms', description: `Created room ${req.body.room_name}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Room created', 201);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.update(parseInt(req.params.id), req.body, req.user?.id);
      await logActivity({ user_id: req.user?.id, action: 'UPDATE_ROOM', module: 'rooms', description: `Updated room ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Room updated');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.delete(parseInt(req.params.id), req.user?.id);
      await logActivity({ user_id: req.user?.id, action: 'DELETE_ROOM', module: 'rooms', description: `Deleted room ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async uploadImages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return sendError(res, 'No files uploaded', 400);
      const imageUrls = files.map(f => `/uploads/${f.filename}`);
      const result = await RoomService.addImages(parseInt(req.params.id), imageUrls);
      sendSuccess(res, result, 'Images uploaded');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async deleteImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.deleteImage(parseInt(req.params.id), parseInt(req.params.imageId));
      sendSuccess(res, result);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async reorderImages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!Array.isArray(req.body.imageIds)) {
        return sendError(res, 'imageIds must be an array', 400);
      }
      const result = await RoomService.reorderImages(parseInt(req.params.id), req.body.imageIds);
      sendSuccess(res, result);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async getQRCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dataUrl = await getQRCodeDataURL(parseInt(req.params.id));
      sendSuccess(res, { qr_code: dataUrl });
    } catch (error) { next(error); }
  }
}
