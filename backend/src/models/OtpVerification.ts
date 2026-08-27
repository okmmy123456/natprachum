import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OtpVerificationAttributes {
  id: number;
  user_id?: number;
  email: string;
  otp_code: string;
  type: 'register' | 'forgot_password' | 'change_email';
  expires_at: Date;
  is_used: boolean;
  pending_data?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface OtpCreationAttributes extends Optional<OtpVerificationAttributes, 'id' | 'user_id' | 'is_used' | 'pending_data'> {}

class OtpVerification extends Model<OtpVerificationAttributes, OtpCreationAttributes> implements OtpVerificationAttributes {
  public id!: number;
  public user_id?: number;
  public email!: string;
  public otp_code!: string;
  public type!: 'register' | 'forgot_password' | 'change_email';
  public expires_at!: Date;
  public is_used!: boolean;
  public pending_data?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

OtpVerification.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER },
    email: { type: DataTypes.STRING(200), allowNull: false },
    otp_code: { type: DataTypes.STRING(10), allowNull: false },
    type: { type: DataTypes.ENUM('register', 'forgot_password', 'change_email'), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
    pending_data: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: 'otp_verifications', modelName: 'OtpVerification' }
);

export default OtpVerification;
