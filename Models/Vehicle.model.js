import { DataTypes } from 'sequelize';
import sequelize from '../Utils/db.js';

const Vehicle = sequelize.define(
  'vehicles',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    operator_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    vehicle_type: {
      type: DataTypes.ENUM(
        'MATATU',
        'MINIBUS',
        'BUS',
        'COACH'
      ),
      allowNull: false
    },
    service_class: {
      type: DataTypes.ENUM(
        'STANDARD',
        'AC',
        'VIP',
        'SEMI_SLEEPER',
        'SLEEPER'
      ),
      defaultValue: 'STANDARD'
    },
    registration_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    vehicle_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    // defaultScope: {
    //   attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] }
    // }
  }
);

export default Vehicle;