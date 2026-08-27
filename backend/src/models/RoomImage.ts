import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RoomImageAttributes {
  id: number;
  room_id: number;
  image_url: string;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface RoomImageCreationAttributes extends Optional<RoomImageAttributes, 'id' | 'sort_order'> {}

class RoomImage extends Model<RoomImageAttributes, RoomImageCreationAttributes> implements RoomImageAttributes {
  public id!: number;
  public room_id!: number;
  public image_url!: string;
  public sort_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RoomImage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    image_url: { type: DataTypes.STRING(500), allowNull: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { sequelize, tableName: 'room_images', modelName: 'RoomImage' }
);

export default RoomImage;
