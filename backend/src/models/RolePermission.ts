import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RolePermissionAttributes {
  id: number;
  role_id: number;
  permission_id: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

class RolePermission extends Model<RolePermissionAttributes> implements RolePermissionAttributes {
  public id!: number;
  public role_id!: number;
  public permission_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RolePermission.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    permission_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    modelName: 'RolePermission',
    indexes: [{ unique: true, fields: ['role_id', 'permission_id'] }],
  }
);

export default RolePermission;
