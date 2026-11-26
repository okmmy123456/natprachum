import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BookingAttributes {
  id: number;
  booking_no: string;
  booking_name: string;
  phone_number?: string;
  room_id: number;
  user_id?: number;
  participant_count: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  additional_note?: string;
  status_id: number;
  is_guest_booking: boolean;
  link_training_system?: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_company_id?: number;
  guest_department_code?: string;
  guest_department_name?: string;
  approved_by?: number;
  approved_at?: Date;
  reject_reason?: string;
  cancel_reason?: string;
  edit_notes?: string;
  equipment_status?: 'none' | 'pending' | 'approved' | 'rejected';
  equipment_reject_reason?: string;
  equipment_approved_by?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface BookingCreationAttributes extends Optional<BookingAttributes, 'id' | 'phone_number' | 'user_id' | 'purpose' | 'additional_note' | 'is_guest_booking' | 'guest_name' | 'guest_email' | 'guest_phone' | 'guest_company_id' | 'guest_department_code' | 'guest_department_name' | 'approved_by' | 'approved_at' | 'reject_reason' | 'cancel_reason' | 'edit_notes' | 'equipment_status' | 'equipment_reject_reason' | 'equipment_approved_by'> {}

class Booking extends Model<BookingAttributes, BookingCreationAttributes> implements BookingAttributes {
  public id!: number;
  public booking_no!: string;
  public booking_name!: string;
  public phone_number?: string;
  public room_id!: number;
  public user_id?: number;
  public participant_count!: number;
  public booking_date!: string;
  public start_time!: string;
  public end_time!: string;
  public purpose?: string;
  public additional_note?: string;
  public status_id!: number;
  public is_guest_booking!: boolean;
  public link_training_system?: boolean;
  public guest_name?: string;
  public guest_email?: string;
  public guest_phone?: string;
  public guest_company_id?: number;
  public guest_department_code?: string;
  public guest_department_name?: string;
  public approved_by?: number;
  public approved_at?: Date;
  public reject_reason?: string;
  public cancel_reason?: string;
  public edit_notes?: string;
  public equipment_status?: 'none' | 'pending' | 'approved' | 'rejected';
  public equipment_reject_reason?: string;
  public equipment_approved_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  // Associations
  public Room?: any;
  public User?: any;
  public Status?: any;
  public Approver?: any;
  public Participants?: any[];
}

Booking.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    booking_name: { type: DataTypes.STRING(300), allowNull: false },
    phone_number: { type: DataTypes.STRING(20) },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER },
    participant_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    booking_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    purpose: { type: DataTypes.TEXT },
    additional_note: { type: DataTypes.TEXT },
    status_id: { type: DataTypes.INTEGER, allowNull: false },
    is_guest_booking: { type: DataTypes.BOOLEAN, defaultValue: false },
    link_training_system: { type: DataTypes.BOOLEAN, defaultValue: false },
    guest_name: { type: DataTypes.STRING(150) },
    guest_email: { type: DataTypes.STRING(150) },
    guest_phone: { type: DataTypes.STRING(20) },
    guest_company_id: { type: DataTypes.INTEGER },
    guest_department_code: { type: DataTypes.STRING(255) },
    guest_department_name: { type: DataTypes.STRING(255) },
    approved_by: { type: DataTypes.INTEGER },
    approved_at: { type: DataTypes.DATE },
    reject_reason: { type: DataTypes.TEXT },
    cancel_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    edit_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    equipment_status: {
      type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
      defaultValue: 'none',
    },
    equipment_reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    equipment_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'bookings',
    modelName: 'Booking',
    indexes: [
      { fields: ['booking_date', 'room_id'] },
      { fields: ['user_id'] },
      { fields: ['status_id'] },
    ],
  }
);

export default Booking;
