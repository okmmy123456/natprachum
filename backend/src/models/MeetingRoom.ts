import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MeetingRoomAttributes {
  id: number;
  room_name: string;
  location: string;
  additional_location?: string;
  description?: string;
  capacity: number;
  owner_id?: number;
  owner_email?: string;
  payment_creator_type?: string;
  qr_code_url?: string;
  is_active: boolean;
  auto_approve: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface MeetingRoomCreationAttributes extends Optional<MeetingRoomAttributes, 'id' | 'description' | 'owner_id' | 'owner_email' | 'payment_creator_type' | 'qr_code_url' | 'is_active' | 'auto_approve' | 'additional_location'> {}

class MeetingRoom extends Model<MeetingRoomAttributes, MeetingRoomCreationAttributes> implements MeetingRoomAttributes {
  public id!: number;
  public room_name!: string;
  public location!: string;
  public additional_location?: string;
  public description?: string;
  public capacity!: number;
  public owner_id?: number;
  public owner_email?: string;
  public payment_creator_type?: string;
  public qr_code_url?: string;
  public is_active!: boolean;
  public auto_approve!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  // Associations
  public RoomImages?: any[];
  public RoomEquipments?: any[];
  public Owners?: any[];
}

MeetingRoom.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    room_name: { type: DataTypes.STRING(200), allowNull: false },
    location: { type: DataTypes.STRING(300), allowNull: false },
    additional_location: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    owner_id: { type: DataTypes.INTEGER },
    owner_email: { type: DataTypes.STRING(200) },
    payment_creator_type: { type: DataTypes.STRING(255), defaultValue: 'approver' },
    qr_code_url: { type: DataTypes.STRING(500) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    auto_approve: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'meeting_rooms', modelName: 'MeetingRoom' }
);

export default MeetingRoom;
