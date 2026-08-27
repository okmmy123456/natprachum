import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SiteAttributes {
  id: number;
  site_name: string;
  site_code: string;
  company_id: number;
  address?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SiteCreationAttributes extends Optional<SiteAttributes, 'id' | 'address' | 'is_active'> {}

class Site extends Model<SiteAttributes, SiteCreationAttributes> implements SiteAttributes {
  public id!: number;
  public site_name!: string;
  public site_code!: string;
  public company_id!: number;
  public address?: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Site.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    site_name: { type: DataTypes.STRING(200), allowNull: false },
    site_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    address: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'sites', modelName: 'Site' }
);

export default Site;
