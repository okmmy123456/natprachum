import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuditLogAttributes {
  id: number;
  table_name: string;
  record_id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  old_data?: object;
  new_data?: object;
  action_by?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'old_data' | 'new_data' | 'action_by'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public table_name!: string;
  public record_id!: number;
  public action_type!: 'CREATE' | 'UPDATE' | 'DELETE';
  public old_data?: object;
  public new_data?: object;
  public action_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  public User?: any;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    table_name: { type: DataTypes.STRING(100), allowNull: false },
    record_id: { type: DataTypes.INTEGER, allowNull: false },
    action_type: { type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'), allowNull: false },
    old_data: { type: DataTypes.JSON },
    new_data: { type: DataTypes.JSON },
    action_by: { type: DataTypes.INTEGER },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    modelName: 'AuditLog',
    indexes: [{ fields: ['table_name', 'record_id'] }],
  }
);

export default AuditLog;
