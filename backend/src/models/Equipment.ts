import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EquipmentAttributes {
  id: number;
  equipment_name: string;
  equipment_code: string;
  icon?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface EquipmentCreationAttributes extends Optional<EquipmentAttributes, 'id' | 'icon' | 'is_active'> {}

class Equipment extends Model<EquipmentAttributes, EquipmentCreationAttributes> implements EquipmentAttributes {
  public id!: number;
  public equipment_name!: string;
  public equipment_code!: string;
  public icon?: string;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Equipment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipment_name: { type: DataTypes.STRING(200), allowNull: false },
    equipment_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    icon: { type: DataTypes.STRING(100) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'equipments', modelName: 'Equipment' }
);

export default Equipment;
