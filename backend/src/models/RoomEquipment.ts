import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RoomEquipmentAttributes {
  id: number;
  room_id: number;
  equipment_id: number;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

class RoomEquipment extends Model<RoomEquipmentAttributes> implements RoomEquipmentAttributes {
  public id!: number;
  public room_id!: number;
  public equipment_id!: number;
  public quantity!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  public Equipment?: any;
}

RoomEquipment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    equipment_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  },
  {
    sequelize,
    tableName: 'room_equipments',
    modelName: 'RoomEquipment',
    indexes: [{ unique: true, fields: ['room_id', 'equipment_id'] }],
  }
);

export default RoomEquipment;
