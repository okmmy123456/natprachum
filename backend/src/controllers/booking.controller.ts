import FoodOrder from '../models/FoodOrder';
import FoodOrderDiner from '../models/FoodOrderDiner';
import Booking from '../models/Booking';
import { PdfService } from '../services/pdf.service';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { BookingService } from '../services/booking.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { logActivity } from '../services/activitylog.service';
import { getClientIP } from '../utils/helpers';

export class BookingController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query: any = { ...req.query };
      const isMyBookings = query.my_bookings === 'true';
      delete query.my_bookings;
      
      // Filter to user's own bookings (including guest bookings matching their email)
      if (isMyBookings || (!query.room_id && req.user?.role_name !== 'SuperAdmin' && req.user?.role_name !== 'Admin')) {
        query.owner_user_id = req.user?.id;
        query.owner_email = req.user?.email;
      }
      
      const result = await BookingService.getAll(query);
      sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) { next(error); }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await BookingService.getById(parseInt(req.params.id))); }
    catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.create(req.body, req.user?.id);
      await logActivity({ user_id: req.user?.id, action: 'CREATE_BOOKING', module: 'bookings', description: `Created booking ${result.booking_no}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Booking created', 201);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.update(parseInt(req.params.id), req.body, req.user?.id, req.user?.role_name, req.user?.email);
      sendSuccess(res, result, 'Booking updated');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.cancel(parseInt(req.params.id), req.body.cancel_reason || '', req.user?.id, req.user?.role_name, req.user?.email);
      await logActivity({ user_id: req.user?.id, action: 'CANCEL_BOOKING', module: 'bookings', description: `Cancelled booking ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Booking cancelled');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  
  static async guestFoodPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { booking_id, guest_email } = req.body;
      if (!booking_id || !guest_email) {
        return sendError(res, 'booking_id and guest_email are required', 400);
      }

      const booking = await Booking.findOne({
        where: { id: booking_id, guest_email: guest_email, is_guest_booking: true },
        include: [{ model: FoodOrder, as: 'FoodOrder' }]
      });

      if (!booking || !(booking as any).FoodOrder) {
        return sendError(res, 'Food order not found for this guest booking', 404);
      }

      const order = await FoodOrder.findByPk((booking as any).FoodOrder.id, {
        include: [
          { model: FoodOrderDiner, as: 'Diners' },
        ]
      });

      if (!order) {
        return sendError(res, 'Food order not found', 404);
      }

      const pdfBuffer = await PdfService.generateFoodOrderPdf(order as any);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=FoodOrder-${order.id}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  static async guestBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.createGuestBooking(req.body);
      sendSuccess(res, result, 'Guest booking created', 201);
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await BookingService.delete(parseInt(req.params.id), req.user?.id, req.user?.role_name, req.user?.email);
      await logActivity({ user_id: req.user?.id, action: 'DELETE_BOOKING', module: 'bookings', description: `Deleted booking ${req.params.id}`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, null, 'Booking deleted successfully');
    } catch (error: any) { error.statusCode ? sendError(res, error.message, error.statusCode) : next(error); }
  }
}
