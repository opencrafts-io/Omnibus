// models/Transaction.js (Updated with booking_id)
import { DataTypes } from 'sequelize';
import sequelize from '../Utils/db.js';

const Transaction = sequelize.define(
  'transactions',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    booking_id: {
      type: DataTypes.UUID,
      allowNull: true, // Link to booking
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    trip_id: {
      type: DataTypes.UUID,
      allowNull: true, // Link to trip
      references: {
        model: 'trips',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'KES',
    },
    payment_method: {
      type: DataTypes.ENUM('MPESA', 'AIRTEL', 'CARD', 'BANK', 'CASH', 'UPI', 'WALLET'),
      allowNull: false,
      defaultValue: 'MPESA',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REVERSED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    checkout_request_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchant_request_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transaction_reference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    booking_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provider_response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    failure_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    defaultScope: {
      attributes: { exclude: ['deleted_at'] },
    },
    scopes: {
      withDeleted: {
        attributes: { include: ['deleted_at'] },
      },
    },
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['booking_id']
      },
      {
        fields: ['trip_id']
      },
      {
        fields: ['booking_reference']
      },
      {
        fields: ['status']
      }
    ]
  }
);

export default Transaction;