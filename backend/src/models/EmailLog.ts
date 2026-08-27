import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EmailLogAttributes {
  id: number;
  user_id?: number;
  to_email: string;
  subject: string;
  body: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface EmailLogCreationAttributes extends Optional<EmailLogAttributes, 'id' | 'user_id' | 'status' | 'error_message'> {}

class EmailLog extends Model<EmailLogAttributes, EmailLogCreationAttributes> implements EmailLogAttributes {
  public id!: number;
  public user_id?: number;
  public to_email!: string;
  public subject!: string;
  public body!: string;
  public type!: string;
  public status!: 'sent' | 'failed' | 'pending';
  public error_message?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

EmailLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER },
    to_email: { type: DataTypes.STRING(200), allowNull: false },
    subject: { type: DataTypes.STRING(500), allowNull: false },
    body: { type: DataTypes.TEXT('long'), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    status: { type: DataTypes.ENUM('sent', 'failed', 'pending'), defaultValue: 'pending' },
    error_message: { type: DataTypes.TEXT },
  },
  { sequelize, tableName: 'email_logs', modelName: 'EmailLog' }
);

export default EmailLog;
