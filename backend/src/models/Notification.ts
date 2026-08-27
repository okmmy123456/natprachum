import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NotificationAttributes {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  reference_id?: number;
  reference_type?: string;
  is_read: boolean;
  read_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'reference_id' | 'reference_type' | 'is_read' | 'read_at'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public title!: string;
  public message!: string;
  public type!: string;
  public reference_id?: number;
  public reference_type?: string;
  public is_read!: boolean;
  public read_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(300), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'info' },
    reference_id: { type: DataTypes.INTEGER },
    reference_type: { type: DataTypes.STRING(50) },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    read_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: 'notifications',
    modelName: 'Notification',
    indexes: [{ fields: ['user_id', 'is_read'] }],
  }
);

export default Notification;
