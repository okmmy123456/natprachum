import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CompanyAttributes {
  id: number;
  company_name: string;
  company_code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'address' | 'phone' | 'email' | 'is_active'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number;
  public company_name!: string;
  public company_code!: string;
  public address?: string;
  public phone?: string;
  public email?: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Company.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company_name: { type: DataTypes.STRING(200), allowNull: false },
    company_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    address: { type: DataTypes.TEXT },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'companies', modelName: 'Company' }
);

export default Company;
