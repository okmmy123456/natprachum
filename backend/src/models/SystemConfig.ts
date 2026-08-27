import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SystemConfigAttributes {
  id: number;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  updated_by?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface SystemConfigCreationAttributes extends Optional<SystemConfigAttributes, 'id' | 'config_type' | 'description' | 'updated_by'> {}

class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> implements SystemConfigAttributes {
  public id!: number;
  public config_key!: string;
  public config_value!: string;
  public config_type!: 'string' | 'number' | 'boolean' | 'json';
  public description?: string;
  public updated_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

SystemConfig.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    config_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    config_value: { type: DataTypes.TEXT, allowNull: false },
    config_type: { type: DataTypes.ENUM('string', 'number', 'boolean', 'json'), defaultValue: 'string' },
    description: { type: DataTypes.TEXT },
    updated_by: { type: DataTypes.INTEGER },
  },
  { sequelize, tableName: 'system_configs', modelName: 'SystemConfig' }
);

export default SystemConfig;
