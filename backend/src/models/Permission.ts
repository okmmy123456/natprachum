import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PermissionAttributes {
  id: number;
  permission_name: string;
  permission_code: string;
  module: string;
  type: 'menu' | 'api';
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'description'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number;
  public permission_name!: string;
  public permission_code!: string;
  public module!: string;
  public type!: 'menu' | 'api';
  public description?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Permission.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    permission_name: { type: DataTypes.STRING(200), allowNull: false },
    permission_code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    module: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('menu', 'api'), allowNull: false, defaultValue: 'api' },
    description: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: 'permissions', modelName: 'Permission' }
);

export default Permission;
