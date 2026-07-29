import { DataTypes } from "sequelize";
import sequelize from "../Utils/db.js";

const PaymentInfo = sequelize.define(
  "payment_infos",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },

    payment_type: {
      type: DataTypes.ENUM(
        "MPESA_PAYBILL",
        "MPESA_TILL",
        "MPESA_SEND_MONEY",
        "POSHI_LA_BIASHARA",
      ),
      allowNull: false,
    },

    /* ========= PAYBILL ========= */
    paybill_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paybill_account_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    /* ========= TILL ========= */
    till_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    /* ========= SEND MONEY ========= */
    phone_number: {
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
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

export default PaymentInfo;
