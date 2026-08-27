import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CompanyHolidayAttributes {
  id: number;
  company_id?: number;
  holiday_name: string;
  holiday_date: string;
  description?: string;
  is_recurring: boolean;
  allow_special_approval: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface CompanyHolidayCreationAttributes extends Optional<CompanyHolidayAttributes, 'id' | 'company_id' | 'description' | 'is_recurring' | 'allow_special_approval'> {}

class CompanyHoliday extends Model<CompanyHolidayAttributes, CompanyHolidayCreationAttributes> implements CompanyHolidayAttributes {
  public id!: number;
  public company_id?: number;
  public holiday_name!: string;
  public holiday_date!: string;
  public description?: string;
  public is_recurring!: boolean;
  public allow_special_approval!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

CompanyHoliday.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company_id: { type: DataTypes.INTEGER },
    holiday_name: { type: DataTypes.STRING(200), allowNull: false },
    holiday_date: { type: DataTypes.DATEONLY, allowNull: false },
    description: { type: DataTypes.TEXT },
    is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
    allow_special_approval: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'company_holidays', modelName: 'CompanyHoliday' }
);

export default CompanyHoliday;
