import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id: number;
  username: string;
  password_hash?: string | null;
  first_name: string;
  last_name: string;
  company_id?: number;
  site_id?: number; site?: string;
  department_id?: number;
  department_code?: string;
  department_name?: string;
  position?: string;
  mobile_phone?: string;
  office_phone?: string;
  email: string;
  email_verified: boolean;
  tciconnect_id?: string | null;
  avatar_url?: string;
  role_id: number;
  is_active: boolean;
  last_login_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'password_hash' | 'company_id' | 'site_id' | 'department_id' | 'department_code' | 'department_name' | 'position' | 'mobile_phone' | 'office_phone' | 'email_verified' | 'tciconnect_id' | 'avatar_url' | 'is_active' | 'last_login_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password_hash?: string | null;
  public first_name!: string;
  public last_name!: string;
  public company_id?: number;
  public site_id?: number; site?: string;
  public department_id?: number;
  public department_code?: string;
  public department_name?: string;
  public position?: string;
  public mobile_phone?: string;
  public office_phone?: string;
  public email!: string;
  public email_verified!: boolean;
  public tciconnect_id?: string | null;
  public avatar_url?: string;
  public role_id!: number;
  public is_active!: boolean;
  public last_login_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  // Associations
  public Role?: any;
  public Company?: any;
  public Site?: any;
  public Department?: any;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    company_id: { type: DataTypes.INTEGER },
    site_id: { type: DataTypes.INTEGER }, site: { type: DataTypes.STRING },
    department_id: { type: DataTypes.INTEGER },
    department_code: { type: DataTypes.STRING(50) },
    department_name: { type: DataTypes.STRING(200) },
    position: { type: DataTypes.STRING(100) },
    mobile_phone: { type: DataTypes.STRING(20) },
    office_phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    tciconnect_id: { type: DataTypes.STRING(36), allowNull: true, unique: true },
    avatar_url: { type: DataTypes.STRING(500) },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_login_at: { type: DataTypes.DATE },
  },
  { sequelize, tableName: 'users', modelName: 'User' }
);

export default User;
