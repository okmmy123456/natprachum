import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FoodOrderDinerAttributes {
  id: number;
  food_order_id: number;
  diner_type: 'guest' | 'internal';
  diner_name: string;
  department?: string;
  department_code?: string;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface FoodOrderDinerCreationAttributes extends Optional<FoodOrderDinerAttributes, 'id' | 'department' | 'department_code'> {}

class FoodOrderDiner extends Model<FoodOrderDinerAttributes, FoodOrderDinerCreationAttributes> implements FoodOrderDinerAttributes {
  public id!: number;
  public food_order_id!: number;
  public diner_type!: 'guest' | 'internal';
  public diner_name!: string;
  public department?: string;
  public department_code?: string;
  public sort_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  // Associations
  public FoodOrder?: any;
}

FoodOrderDiner.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    food_order_id: { type: DataTypes.INTEGER, allowNull: false },
    diner_type: { 
      type: DataTypes.ENUM('guest', 'internal'), 
      allowNull: false 
    },
    diner_name: { type: DataTypes.STRING(200), allowNull: false },
    department: { type: DataTypes.STRING(200) },
    department_code: { type: DataTypes.STRING(50) },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'food_order_diners',
    modelName: 'FoodOrderDiner',
    indexes: [
      { fields: ['food_order_id'] },
    ],
  }
);

export default FoodOrderDiner;
