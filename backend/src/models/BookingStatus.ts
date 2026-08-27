import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BookingStatusAttributes {
  id: number;
  status_name: string;
  status_code: string;
  color: string;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface BookingStatusCreationAttributes extends Optional<BookingStatusAttributes, 'id' | 'color' | 'sort_order'> {}

class BookingStatus extends Model<BookingStatusAttributes, BookingStatusCreationAttributes> implements BookingStatusAttributes {
  public id!: number;
  public status_name!: string;
  public status_code!: string;
  public color!: string;
  public sort_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

BookingStatus.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status_name: { type: DataTypes.STRING(50), allowNull: false },
    status_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    color: { type: DataTypes.STRING(20), defaultValue: '#6B7280' },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { sequelize, tableName: 'booking_status', modelName: 'BookingStatus' }
);

export default BookingStatus;
