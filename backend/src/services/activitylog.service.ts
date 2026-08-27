import { Op } from 'sequelize';
import { ActivityLog, User } from '../models';
import { getPagination, getSorting } from '../utils/pagination';

interface ActivityLogData {
  user_id?: number;
  action: string;
  module: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
}

export const logActivity = async (data: ActivityLogData): Promise<void> => {
  try {
    await ActivityLog.create(data as any);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export class ActivityLogService {
  static async getAll(query: any) {
    const { page, limit, offset } = getPagination(query);
    const { sortBy, sortOrder } = getSorting(query, ['created_at', 'action', 'module']);

    const whereClause: any = { deleted_at: null };

    if (query.search) {
      whereClause[Op.or] = [
        { action: { [Op.like]: `%${query.search}%` } },
        { module: { [Op.like]: `%${query.search}%` } },
        { description: { [Op.like]: `%${query.search}%` } },
      ];
    }

    if (query.module) {
      whereClause.module = query.module;
    }

    if (query.action) {
      whereClause.action = query.action;
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'first_name', 'last_name', 'username', 'email'],
          where: { deleted_at: null },
          required: false,
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }
}
