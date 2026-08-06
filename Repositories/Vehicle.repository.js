// repositories/vehicleRepository.js
import { Vehicle, Trip, TripSeat } from "../Models/index.js";
import { Op, Sequelize } from "sequelize";

export const createVehicleRepository = async (vehicleData, options = {}) => {
  try {
    const { registration_number } = vehicleData;

    // 1. Check for existing record (including soft-deleted rows)
    const existingVehicle = await Vehicle.findOne({
      where: { registration_number },
      paranoid: false, // 👈 Bypasses soft-delete filter
      ...options
    });

    if (existingVehicle) {
      // Case A: Soft-deleted vehicle found -> Restore and update with new data
      if (existingVehicle.deletedAt !== null) {
        await existingVehicle.restore(options);
        await existingVehicle.update(vehicleData, options);
        return existingVehicle;
      }

      // Case B: Active vehicle found -> Reject creation
      const error = new Error(`Vehicle with registration number '${registration_number}' already exists.`);
      error.statusCode = 409; // Conflict
      throw error;
    }

    // 2. No previous record exists -> Create a new vehicle
    const newVehicle = await Vehicle.create(vehicleData, options);
    return newVehicle;
  } catch (error) {
    throw error;
  }
};

export const getAllVehiclesRepository = async (limitPlusOne, offset) => {
  try {
    const vehicles = await Vehicle.findAll({
      order: [["created_at", "DESC"]],
      limit: limitPlusOne,
      offset,
      include: [
        {
          model: Trip,
          as: "trips",
          attributes: ["id", "departure_location", "arrival_location", "departure_time", "status"]
        }
      ]
    });
    return vehicles;
  } catch (error) {
    throw error;
  }
};

export const getVehicleByIdRepository = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [
        {
          model: Trip,
          as: "trips",
          include: [
            {
              model: TripSeat,
              as: "seats",
              where: { is_available: true },
              required: false
            }
          ]
        }
      ]
    });
    return vehicle;
  } catch (error) {
    throw error;
  }
};

export const updateVehicleRepository = async (vehicleId, vehicleData) => {
  try {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    await vehicle.update(vehicleData);
    return vehicle;
  } catch (error) {
    throw error;
  }
};

export const deleteVehicleRepository = async (vehicleId) => {
  try {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      return null;
    }
    await vehicle.destroy();
    return vehicle;
  } catch (error) {
    throw error;
  }
};

export const getVehicleByRegistrationRepository = async (registrationNumber) => {
  try {
    const vehicle = await Vehicle.findAll({
      where: { 
        registration_number: {
          [Op.iLike]: `%${registrationNumber}%` // Add % wildcards for partial matching
        }
      }
    });
    return vehicle;
  } catch (error) {
    throw error;
  }
};
export const getVehiclesByTypeRepository = async (vehicleType) => {
  try {
    const vehicles = await Vehicle.findAll({
      where: { vehicle_type: vehicleType },
      include: [
        {
          model: Trip,
          as: "trips",
          where: { status: "SCHEDULED" },
          required: false
        }
      ]
    });
    return vehicles;
  } catch (error) {
    throw error;
  }
};

export const getAllVehiclesByOperatorRepository = async (operator_name = '') => {
  try {
    const whereClause = {};

    // Only add search filter if a valid query string is provided
    if (operator_name && operator_name.trim() !== '') {
      whereClause.operator_name = {
        [Op.iLike]: `%${operator_name.trim()}%` // 👈 Case-insensitive wildcard match
      };
    }

    const vehicles = await Vehicle.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Trip,
          as: "trips",
          where: { status: "SCHEDULED" },
          required: false
        }
      ]
    });

    return vehicles;
  } catch (error) {
    throw error;
  }
};