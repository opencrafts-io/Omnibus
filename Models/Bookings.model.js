import { DataTypes } from 'sequelize';
import sequelize from '../Utils/db.js';

const Booking = sequelize.define(
  'bookings',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    trip_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
      defaultValue: 'PENDING'
    },
    payment_status: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED'),
      defaultValue: 'PENDING'
    },
    payment_method: {
      type: DataTypes.ENUM('CASH', 'CARD', "MPESA"),
      allowNull: true
    },
    booking_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    passenger_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    special_requests: {
      type: DataTypes.TEXT,
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
    defaultScope: {
      attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] }
    }
  }
);

export default Booking;