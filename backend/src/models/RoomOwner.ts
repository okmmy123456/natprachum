import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RoomOwnerAttributes {
  id: number;
  room_id: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class RoomOwner extends Model<RoomOwnerAttributes> implements RoomOwnerAttributes {
  public id!: number;
  public room_id!: number;
  public user_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RoomOwner.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    sequelize,
    tableName: 'room_owners',
    modelName: 'RoomOwner',
    indexes: [{ unique: true, fields: ['room_id', 'user_id'] }],
  }
);

export default RoomOwner;
