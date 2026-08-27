import { Request, Response, NextFunction } from 'express';
import { OtpService } from '../services/otp.service';
import { sendSuccess, sendError } from '../utils/response';
import { Booking, MeetingRoom, BookingStatus, User, FoodOrder, FoodOrderDiner } from '../models';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { BookingService } from '../services/booking.service';
import { PdfService } from '../services/pdf.service';

export class HistoryController {
  static async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, 'Email is required', 400);
        return;
      }

      const success = await OtpService.requestOtp(email);
      if (success) {
        sendSuccess(res, { message: 'OTP sent successfully' });
      } else {
        sendError(res, 'Failed to send OTP', 500);
      }
    } catch (error) { next(error); }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        sendError(res, 'Email and OTP are required', 400);
        return;
      }

      const token = OtpService.verifyOtp(email, otp);
      if (token) {
        sendSuccess(res, { token });
      } else {
        sendError(res, 'Invalid or expired OTP', 401);
      }
    } catch (error) { next(error); }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 'Access token is required', 401);
        return;
      }

      const token = authHeader.split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, jwtConfig.secret);
      } catch (err) {
        sendError(res, 'Invalid or expired token', 401);
        return;
      }

      if (decoded.role_name !== 'HistoryViewer' || !decoded.email) {
        sendError(res, 'Unauthorized token type', 403);
        return;
      }

      const email = decoded.email;

      // Find user id by email if they are a registered user
      const user = await User.findOne({ where: { email } });
      
      const whereClause: any = {};
      if (user) {
        whereClause[Op.or] = [
          { user_id: user.id },
          { guest_email: email }
        ];
      } else {
        whereClause.guest_email = email;
      }

      const bookings = await Booking.findAll({
        where: whereClause,
        include: [
          { model: MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location'] },
          { model: BookingStatus, as: 'Status' },
          { model: FoodOrder, as: 'FoodOrder' }
        ],
        order: [['booking_date', 'DESC'], ['start_time', 'DESC']]
      });

      sendSuccess(res, bookings);
    } catch (error) { next(error); }
  }
  static async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const email = HistoryController.verifyAndGetEmail(req);
      if (!email) { sendError(res, 'Unauthorized', 401); return; }

      const id = parseInt(req.params.id);
      const booking = await BookingService.getById(id);
      if (!booking) { sendError(res, 'Booking not found', 404); return; }

      // Check if user owns this booking
      const user = await User.findOne({ where: { email } });
      const isOwner = (user && booking.user_id === user.id) || (booking.guest_email === email);
      if (!isOwner) { sendError(res, 'Forbidden', 403); return; }

      sendSuccess(res, booking);
    } catch (error) { next(error); }
  }

  static async updateBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const email = HistoryController.verifyAndGetEmail(req);
      if (!email) { sendError(res, 'Unauthorized', 401); return; }

      const id = parseInt(req.params.id);
      const result = await BookingService.update(id, req.body, undefined, 'Guest', email);
      sendSuccess(res, result, 'Booking updated successfully');
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const email = HistoryController.verifyAndGetEmail(req);
      if (!email) { sendError(res, 'Unauthorized', 401); return; }

      const id = parseInt(req.params.id);
      const reason = req.body.cancel_reason || 'Cancelled by guest';
      const result = await BookingService.cancel(id, reason, undefined, 'Guest', email);
      sendSuccess(res, result, 'Booking cancelled successfully');
    } catch (error: any) {
      error.statusCode ? sendError(res, error.message, error.statusCode) : next(error);
    }
  }

  private static verifyAndGetEmail(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, jwtConfig.secret);
      if (decoded.role_name === 'HistoryViewer' && decoded.email) {
        return decoded.email;
      }
    } catch (err) {}
    return null;
  }

  static async exportFoodPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 'Access token is required', 401);
        return;
      }

      const token = authHeader.split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, jwtConfig.secret);
      } catch (err) {
        sendError(res, 'Invalid or expired token', 401);
        return;
      }

      if (decoded.role_name !== 'HistoryViewer' || !decoded.email) {
        sendError(res, 'Unauthorized token type', 403);
        return;
      }

      const email = decoded.email;
      
      const order = await FoodOrder.findByPk(parseInt(req.params.id), {
        include: [
          { model: FoodOrderDiner, as: 'Diners' },
          { model: Booking, as: 'Booking', include: [{ model: User, as: 'User' }] }
        ]
      });
      
      if (!order) {
        return sendError(res, 'Food order not found', 404);
      }

      // Check if this food order belongs to a booking owned by this guest
      const user = await User.findOne({ where: { email } });
      const booking = order.Booking;
      
      let isAuthorized = false;
      if (booking.guest_email === email) {
        isAuthorized = true;
      } else if (user && booking.user_id === user.id) {
        isAuthorized = true;
      }
      
      if (!isAuthorized) {
        return sendError(res, 'Unauthorized to access this food order', 403);
      }

      const pdfBuffer = await PdfService.generateFoodOrderPdf(order as any);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=FoodOrder-${order.id}.pdf`);
      res.send(pdfBuffer);
      
    } catch (error) { next(error); }
  }

}