import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Notification } from '../models';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { getUnreadCount } from '../services/notification.service';

export class NotificationController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, offset } = getPagination(req.query as any);
      const { count, rows } = await Notification.findAndCountAll({
        where: { user_id: req.user!.id },
        order: [['created_at', 'DESC']],
        limit, offset,
      });
      sendPaginated(res, rows, count, page, limit);
    } catch (error) { next(error); }
  }

  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await getUnreadCount(req.user!.id);
      sendSuccess(res, { unread_count: count });
    } catch (error) { next(error); }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await Notification.findOne({ where: { id: parseInt(req.params.id), user_id: req.user!.id } });
      if (!notification) return sendError(res, 'Notification not found', 404);
      await notification.update({ is_read: true, read_at: new Date() });
      sendSuccess(res, notification, 'Marked as read');
    } catch (error) { next(error); }
  }

  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await Notification.update({ is_read: true, read_at: new Date() }, { where: { user_id: req.user!.id, is_read: false } });
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  }
}
