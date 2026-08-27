import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Role, Company, Site, Department, Booking } from '../models';
import { getPagination, getSorting } from '../utils/pagination';
import { logAudit } from './auditlog.service';

export class UserService {
  static async getAll(query: any) {
    const { page, limit, offset } = getPagination(query);
    const { sortBy, sortOrder } = getSorting(query, ['created_at', 'username', 'first_name', 'email']);

    const where: any = {};
    if (query.search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${query.search}%` } },
        { first_name: { [Op.like]: `%${query.search}%` } },
        { last_name: { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
      ];
    }
    if (query.role_id) where.role_id = query.role_id;
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, as: 'Role', attributes: ['id', 'role_name', 'role_code'] },
        { model: Company, as: 'Company', attributes: ['id', 'company_name'] },
        { model: Department, as: 'Department', attributes: ['id', 'department_name'] },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }

  static async getById(id: number) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, as: 'Role' },
        { model: Company, as: 'Company' },
        { model: Site, as: 'Site' },
        { model: Department, as: 'Department' },
      ],
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };
    return user;
  }

  static async create(data: any, actionBy?: number) {
    const existing = await User.findOne({
      where: { [Op.or]: [{ username: data.username }, { email: data.email }] },
      paranoid: false,
    });
    if (existing) {
      throw { statusCode: 409, message: existing.username === data.username ? 'Username already exists' : 'Email already exists' };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      ...data,
      password_hash: passwordHash,
      email_verified: true, // Admin-created users are pre-verified
    });

    await logAudit('users', user.id, 'CREATE', null, user.toJSON(), actionBy);
    return await this.getById(user.id);
  }

  static async update(id: number, data: any, actionBy?: number) {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const oldData = user.toJSON();
    const { password_hash, ...updateData } = data;
    await user.update(updateData);

    await logAudit('users', id, 'UPDATE', oldData, user.toJSON(), actionBy);
    return await this.getById(id);
  }

  static async deactivate(id: number, actionBy?: number) {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    await user.update({ is_active: false });
    await logAudit('users', id, 'UPDATE', { is_active: true }, { is_active: false }, actionBy);
    return { message: 'User deactivated' };
  }

  static async changeRole(id: number, roleId: number, actionBy?: number) {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const role = await Role.findByPk(roleId);
    if (!role) throw { statusCode: 404, message: 'Role not found' };

    const oldRoleId = user.role_id;
    await user.update({ role_id: roleId });
    await logAudit('users', id, 'UPDATE', { role_id: oldRoleId }, { role_id: roleId }, actionBy);

    return await this.getById(id);
  }

  static async resetPassword(id: number, newPassword: string, actionBy?: number) {
    const user = await User.findByPk(id);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: passwordHash });
    await logAudit('users', id, 'UPDATE', {}, { password_reset: true }, actionBy);

    return { message: 'Password reset successfully' };
  }

  static async getBookingHistory(userId: number, query: any) {
    const { page, limit, offset } = getPagination(query);

    const { count, rows } = await Booking.findAndCountAll({
      where: { user_id: userId },
      include: [
        { model: (await import('../models')).MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location'] },
        { model: (await import('../models')).BookingStatus, as: 'Status' },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    return { data: rows, total: count, page, limit };
  }
}
