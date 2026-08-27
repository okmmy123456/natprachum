import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { FoodOrderService } from '../services/foodorder.service';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../services/activitylog.service';
import { getClientIP } from '../utils/helpers';
import { PdfService } from '../services/pdf.service';
import FoodOrder from '../models/FoodOrder';
import FoodOrderDiner from '../models/FoodOrderDiner';
import Booking from '../models/Booking';
import User from '../models/User';

export class FoodOrderController {
  static async getPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FoodOrderService.getPending(req.user!.id, req.user!.role_name);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  static async getByBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FoodOrderService.getByBookingId(parseInt(req.params.bookingId));
      sendSuccess(res, result);
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FoodOrderService.createForBooking(
        parseInt(req.body.booking_id),
        req.body,
        req.user?.id
      );
      await logActivity({
        user_id: req.user?.id,
        action: 'CREATE_FOOD_ORDER',
        module: 'food_orders',
        description: `Created food order for booking ${req.body.booking_id}`,
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
      });
      sendSuccess(res, result, 'Food order created', 201);
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  static async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FoodOrderService.approve(parseInt(req.params.id), req.user!.id);
      await logActivity({
        user_id: req.user?.id,
        action: 'APPROVE_FOOD_ORDER',
        module: 'food_orders',
        description: `Approved food order ${req.params.id}`,
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
      });
      sendSuccess(res, result, 'Food order approved');
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  static async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FoodOrderService.reject(
        parseInt(req.params.id),
        req.user!.id,
        req.body.reject_reason || ''
      );
      await logActivity({
        user_id: req.user?.id,
        action: 'REJECT_FOOD_ORDER',
        module: 'food_orders',
        description: `Rejected food order ${req.params.id}`,
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
      });
      sendSuccess(res, result, 'Food order rejected');
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  static async exportPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await FoodOrder.findByPk(parseInt(req.params.id), {
        include: [
          { model: FoodOrderDiner, as: 'Diners' },
          { model: Booking, as: 'Booking', include: [{ model: User, as: 'User' }] }
        ]
      });
      if (!order) {
        return sendError(res, 'Food order not found', 404);
      }

      const pdfBuffer = await PdfService.generateFoodOrderPdf(order);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=FoodOrder-${order.id}.pdf`);
      res.send(pdfBuffer);
      
      await logActivity({
        user_id: req.user?.id,
        action: 'EXPORT_FOOD_ORDER_PDF',
        module: 'food_orders',
        description: `Exported PDF for food order ${req.params.id}`,
        ip_address: getClientIP(req),
        user_agent: req.headers['user-agent'],
      });
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }
}
