import { DataTypes } from 'sequelize';
import sequelize from '../Utils/db.js';

const TripSeat = sequelize.define(
  'trip_seats',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    vehicle_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    trip_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    seat_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    seat_row: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seat_column: {
      type: DataTypes.STRING(1),
      allowNull: false
    },
    seat_type: {
      type: DataTypes.ENUM('WINDOW', 'AISLE', 'MIDDLE'),
      defaultValue: 'MIDDLE'
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    booked_by : {
      type: DataTypes.UUID,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
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
    defaultScope: {
      attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] }
    }
  }
);

export default TripSeat;