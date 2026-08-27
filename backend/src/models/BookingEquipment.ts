import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface BookingEquipmentAttributes {
  id: number;
  booking_id: number;
  equipment_id: number;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

class BookingEquipment extends Model<BookingEquipmentAttributes> implements BookingEquipmentAttributes {
  public id!: number;
  public booking_id!: number;
  public equipment_id!: number;
  public quantity!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  public Equipment?: any;
}

BookingEquipment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    equipment_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  {
    sequelize,
    tableName: 'booking_equipments',
    modelName: 'BookingEquipment',
    indexes: [{ unique: true, fields: ['booking_id', 'equipment_id'] }],
  }
);

export default BookingEquipment;
