// controllers/vehicleController.js
import {
  createVehicleRepository,
  getAllVehiclesRepository,
  getVehicleByIdRepository,
  updateVehicleRepository,
  deleteVehicleRepository,
  getVehicleByRegistrationRepository,
  getVehiclesByTypeRepository,
  getAllVehiclesByOperatorRepository
} from "../Repositories/Vehicle.repository.js";
import { logs } from "../Utils/logs.js";

export const createVehicleController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { operator_name, total_seats, vehicle_type, service_class, registration_number, vehicle_image } = req.body;

    if (!operator_name || !total_seats || !vehicle_type || !registration_number) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing required vehicle fields", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Operator name, total seats, vehicle type, and registration number are required" });
    }

    // Check if vehicle with registration number already exists
    const existingVehicle = await getVehicleByRegistrationRepository(registration_number);
    if (existingVehicle) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Vehicle with registration number already exists", req.path, 409, req.headers["user-agent"]);
      return res.status(409).json({ error: "Vehicle with this registration number already exists" });
    }

    const vehicle = await createVehicleRepository({
      operator_name,
      total_seats,
      vehicle_type,
      service_class: service_class || 'STANDARD',
      registration_number,
      vehicle_image: vehicle_image || null
    });

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicle created successfully", req.path, 201, req.headers["user-agent"]);

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getAllVehiclesController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { limit, page, limitPlusOne, offset } = req.pagination;

    const result = await getAllVehiclesRepository(limitPlusOne, offset);

    const hasNextPage = result.length > limit;
    const vehicles = hasNextPage ? result.slice(0, limit) : result;

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicles retrieved successfully", req.path, 200, req.headers["user-agent"]);

    return res.status(200).json({
      status: "success",
      currentPage: page,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
      totalVehicles: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getVehicleByIdController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle ID is required" });
    }

    const vehicle = await getVehicleByIdRepository(id);

    if (!vehicle) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "INFO", req.ip, req.method, "Vehicle not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicle retrieved successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json(vehicle);
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const updateVehicleController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle ID is required" });
    }

    const vehicle = await updateVehicleRepository(id, updateData);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicle updated successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    
    if (error.message === 'Vehicle not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteVehicleController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle ID is required" });
    }

    const result = await deleteVehicleRepository(id);

    if (!result) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Vehicle not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicle soft-deleted successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getVehiclesByTypeController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { type } = req.params;

    if (!type) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle type", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle type is required" });
    }

    const vehicles = await getVehiclesByTypeRepository(type);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicles by type retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getVehicleByRegistrationController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { registration } = req.params;
    console.log(registration)
    if (!registration) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle registration", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle registration is required" });
    }

    const vehicle = await getVehicleByRegistrationRepository(registration);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicles by registration retrieved", req.path, 200, req.headers["user-agent"]);

    if(vehicle === null){
      return res.status(404).json({});
    }

    res.status(200).json(
     vehicle
    );
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getVehiclesByOperatorController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { operator } = req.query;

    if (!operator) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle operator", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle operator is required" });
    }

    const vehicles = await getAllVehiclesByOperatorRepository(operator);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Vehicles by operator retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};