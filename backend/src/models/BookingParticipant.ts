import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BookingParticipantAttributes {
  id: number;
  booking_id: number;
  participant_name: string;
  participant_email?: string;
  participant_phone?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface BookingParticipantCreationAttributes extends Optional<BookingParticipantAttributes, 'id' | 'participant_email' | 'participant_phone'> {}

class BookingParticipant extends Model<BookingParticipantAttributes, BookingParticipantCreationAttributes> implements BookingParticipantAttributes {
  public id!: number;
  public booking_id!: number;
  public participant_name!: string;
  public participant_email?: string;
  public participant_phone?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

BookingParticipant.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    participant_name: { type: DataTypes.STRING(200), allowNull: false },
    participant_email: { type: DataTypes.STRING(200) },
    participant_phone: { type: DataTypes.STRING(20) },
  },
  { sequelize, tableName: 'booking_participants', modelName: 'BookingParticipant' }
);

export default BookingParticipant;
