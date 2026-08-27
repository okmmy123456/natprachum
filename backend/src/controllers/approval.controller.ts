import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ApprovalService } from '../services/approval.service';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../services/activitylog.service';
import { getClientIP } from '../utils/helpers';

import { FoodOrderService } from '../services/foodorder.service';

export class ApprovalController {
  static async getBadges(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roomPending = await ApprovalService.getPendingRooms(req.user!.id, req.user!.role_name);
      const equipmentPending = await ApprovalService.getPendingEquipment(req.user!.id, req.user!.role_name);
      const foodPending = await FoodOrderService.getPending(req.user!.id, req.user!.role_name);
      sendSuccess(res, {
        room_approvals: roomPending.length,
        equipment_approvals: equipmentPending.length,
        food_approvals: foodPending.length
      });
    } catch (error) { next(error); }
  }

  static async getPendingRooms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.getPendingRooms(req.user!.id, req.user!.role_name);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  static async getPendingEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.getPendingEquipment(req.user!.id, req.user!.role_name);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  static async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.approve(parseInt(req.params.id), req.user!.id);
      await logActivity({ user_id: req.user?.id, action: 'APPROVE_BOOKING', module: 'approvals', description: `Approved booking ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Booking approved');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.reject(parseInt(req.params.id), req.user!.id, req.body.reject_reason || '');
      await logActivity({ user_id: req.user?.id, action: 'REJECT_BOOKING', module: 'approvals', description: `Rejected booking ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Booking rejected');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async approveEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.approveEquipment(parseInt(req.params.id), req.user!.id);
      await logActivity({ user_id: req.user?.id, action: 'APPROVE_EQUIPMENT', module: 'approvals', description: `Approved equipment for booking ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Equipment approved');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async rejectEquipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.rejectEquipment(parseInt(req.params.id), req.user!.id, req.body.reject_reason || '');
      await logActivity({ user_id: req.user?.id, action: 'REJECT_EQUIPMENT', module: 'approvals', description: `Rejected equipment for booking ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Equipment rejected');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
}
