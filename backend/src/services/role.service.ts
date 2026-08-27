import { Role, Permission, RolePermission } from '../models';
import { logAudit } from './auditlog.service';

export class RoleService {
  static async getAll() {
    return Role.findAll({
      include: [{ model: Permission, as: 'Permissions', through: { attributes: [] } }],
      order: [['id', 'ASC']],
    });
  }

  static async getById(id: number) {
    const role = await Role.findByPk(id, {
      include: [{ model: Permission, as: 'Permissions', through: { attributes: [] } }],
    });
    if (!role) throw { statusCode: 404, message: 'Role not found' };
    return role;
  }

  static async create(data: any, actionBy?: number) {
    const role = await Role.create(data);
    await logAudit('roles', role.id, 'CREATE', null, role.toJSON(), actionBy);
    return role;
  }

  static async update(id: number, data: any, actionBy?: number) {
    const role = await Role.findByPk(id);
    if (!role) throw { statusCode: 404, message: 'Role not found' };

    const oldData = role.toJSON();
    await role.update(data);
    await logAudit('roles', id, 'UPDATE', oldData, role.toJSON(), actionBy);
    return role;
  }

  static async delete(id: number, actionBy?: number) {
    const role = await Role.findByPk(id);
    if (!role) throw { statusCode: 404, message: 'Role not found' };

    await logAudit('roles', id, 'DELETE', role.toJSON(), null, actionBy);
    await role.destroy();
    return { message: 'Role deleted' };
  }

  static async updatePermissions(id: number, permissionIds: number[], actionBy?: number) {
    const role = await Role.findByPk(id);
    if (!role) throw { statusCode: 404, message: 'Role not found' };

    // Remove existing permissions
    await RolePermission.destroy({ where: { role_id: id }, force: true });

    // Add new permissions
    for (const permId of permissionIds) {
      await RolePermission.create({ id: 0, role_id: id, permission_id: permId });
    }

    await logAudit('role_permissions', id, 'UPDATE', {}, { permission_ids: permissionIds }, actionBy);
    return await this.getById(id);
  }

  static async getAllPermissions() {
    return Permission.findAll({ order: [['module', 'ASC'], ['permission_name', 'ASC']] });
  }
}
