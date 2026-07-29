import { DataTypes } from 'sequelize';
import sequelize from '../Utils/db.js';

const BookingSeat = sequelize.define(
  'booking_seats',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    seat_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passenger_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passenger_gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: true
    },
    passenger_contact: {
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
    defaultScope: {
      attributes: { exclude: ['created_at', 'updated_at', 'deleted_at'] }
    }
  }
);

export default BookingSeat;