import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ActivityLogAttributes {
  id: number;
  user_id?: number;
  action: string;
  module: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'user_id' | 'ip_address' | 'user_agent'> {}

class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public user_id?: number;
  public action!: string;
  public module!: string;
  public description!: string;
  public ip_address?: string;
  public user_agent?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  public User?: any;
}

ActivityLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER },
    action: { type: DataTypes.STRING(100), allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    ip_address: { type: DataTypes.STRING(50) },
    user_agent: { type: DataTypes.TEXT },
  },
  {
    sequelize,
    tableName: 'activity_logs',
    modelName: 'ActivityLog',
    indexes: [{ fields: ['user_id'] }, { fields: ['module'] }],
  }
);

export default ActivityLog;
