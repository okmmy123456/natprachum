import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FoodOrderAttributes {
  id: number;
  booking_id: number;
  customer_company?: string; company_name?: string;
  internal_companies?: string; // JSON array of strings
  welcome_sign_needed: boolean;
  welcome_sign_text?: string;
  snack_items?: string; // JSON array of strings (Legacy)
  breakfast_time?: string;
  breakfast_items?: string; // JSON array of strings
  lunch_time?: string;
  lunch_items?: string; // JSON array of strings
  afternoon_time?: string;
  afternoon_items?: string; // JSON array of strings
  additional_notes?: string;
  remarks?: string;
  food_status: 'pending' | 'approved' | 'rejected';
  food_approved_by?: number;
  food_approved_at?: Date;
  food_reject_reason?: string;
  food_edit_details?: string; // JSON array of strings indicating what was changed
  payment_ref_id?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface FoodOrderCreationAttributes extends Optional<FoodOrderAttributes, 'id' | 'company_name' | 'welcome_sign_text' | 'snack_items' | 'breakfast_time' | 'breakfast_items' | 'lunch_time' | 'lunch_items' | 'afternoon_time' | 'afternoon_items' | 'additional_notes' | 'remarks' | 'food_approved_by' | 'food_approved_at' | 'food_reject_reason'> {}

class FoodOrder extends Model<FoodOrderAttributes, FoodOrderCreationAttributes> implements FoodOrderAttributes {
  public id!: number;
  public booking_id!: number;
  public customer_company?: string; company_name?: string;
  public internal_companies?: string;
  public welcome_sign_needed!: boolean;
  public welcome_sign_text?: string;
  public snack_items?: string;
  public breakfast_time?: string;
  public breakfast_items?: string;
  public lunch_time?: string;
  public lunch_items?: string;
  public afternoon_time?: string;
  public afternoon_items?: string;
  public additional_notes?: string;
  public remarks?: string;
  public food_status!: 'pending' | 'approved' | 'rejected';
  public food_approved_by?: number;
  public food_approved_at?: Date;
  public food_reject_reason?: string;
  public food_edit_details?: string;
  public payment_ref_id?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  // Associations
  public Booking?: any;
  public FoodApprover?: any;
  public Diners?: any[];
}

FoodOrder.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    customer_company: { type: DataTypes.STRING, allowNull: true }, company_name: { type: DataTypes.STRING(200) },
    internal_companies: { type: DataTypes.TEXT },
    welcome_sign_needed: { type: DataTypes.BOOLEAN, defaultValue: false },
    welcome_sign_text: { type: DataTypes.STRING(500) },
    snack_items: { type: DataTypes.TEXT }, // JSON string (Legacy)
    breakfast_time: { type: DataTypes.STRING(50) },
    breakfast_items: { type: DataTypes.TEXT }, // JSON string
    lunch_time: { type: DataTypes.STRING(50) },
    lunch_items: { type: DataTypes.TEXT }, // JSON string
    afternoon_time: { type: DataTypes.STRING(50) },
    afternoon_items: { type: DataTypes.TEXT }, // JSON string
    additional_notes: { type: DataTypes.TEXT },
    remarks: { type: DataTypes.TEXT },
    food_status: { 
      type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
      defaultValue: 'pending',
      allowNull: false 
    },
    food_approved_by: { type: DataTypes.INTEGER },
    food_approved_at: { type: DataTypes.DATE },
    food_reject_reason: { type: DataTypes.TEXT },
    food_edit_details: { type: DataTypes.TEXT },
    payment_ref_id: { type: DataTypes.STRING(100) },
  },
  {
    sequelize,
    tableName: 'food_orders',
    modelName: 'FoodOrder',
    indexes: [
      { fields: ['booking_id'], unique: true },
      { fields: ['food_status'] },
    ],
  }
);

export default FoodOrder;
