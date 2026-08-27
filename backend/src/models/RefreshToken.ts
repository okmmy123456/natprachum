import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RefreshTokenAttributes {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  is_revoked: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, 'id' | 'is_revoked'> {}

class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: number;
  public user_id!: number;
  public token!: string;
  public expires_at!: Date;
  public is_revoked!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RefreshToken.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    is_revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'refresh_tokens', modelName: 'RefreshToken' }
);

export default RefreshToken;
