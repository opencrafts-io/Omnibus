// controllers/tripController.js
import {
  createTripRepository,
  getAllTripsRepository,
  getTripByIdRepository,
  updateTripRepository,
  deleteTripRepository,
  getTripsByVehicleRepository,
  searchTripsRepository,
  getAvailableSeatsForTripRepository
} from "../Repositories/Trip.repository.js";
import { getVehicleByIdRepository } from "../Repositories/Vehicle.repository.js";
import { bulkCreateTripSeatsRepository } from "../Repositories/Trip_seat.repository.js";
import { logs } from "../Utils/logs.js";

export const createTripController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { 
      vehicle_id, 
      departure_location, 
      arrival_location, 
      departure_time, 
      arrival_time, 
      base_price, 
      status,
      seats // Array of seat objects
    } = req.body;

    if (!vehicle_id || !departure_location || !arrival_location || !departure_time || !arrival_time || !base_price) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing required trip fields", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle ID, departure/arrival locations, times, and base price are required" });
    }

    // Check if vehicle exists
    const vehicle = await getVehicleByIdRepository(vehicle_id);
    if (!vehicle) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Vehicle not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Calculate available seats from vehicle total seats
    const available_seats = vehicle.total_seats;

    const trip = await createTripRepository({
      vehicle_id,
      departure_location,
      arrival_location,
      departure_time,
      arrival_time,
      base_price,
      status: status || 'SCHEDULED',
      available_seats
    });

    // Create seats for this trip if provided
    if (seats && seats.length > 0) {
      const seatData = seats.map(seat => ({
        vehicle_id,
        trip_id: trip.id,
        seat_number: seat.seat_number,
        seat_row: seat.seat_row,
        seat_column: seat.seat_column,
        seat_type: seat.seat_type || 'MIDDLE',
        is_available: true,
        price: seat.price || base_price
      }));
      await bulkCreateTripSeatsRepository(seatData);
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trip created successfully", req.path, 201, req.headers["user-agent"]);

    res.status(201).json({
      message: "Trip created successfully",
      trip
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getAllTripsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { limit, page, limitPlusOne, offset } = req.pagination;
    const { departure_location, arrival_location, status, departure_date } = req.query;

    const filters = {};
    if (departure_location) filters.departure_location = departure_location;
    if (arrival_location) filters.arrival_location = arrival_location;
    if (status) filters.status = status;
    if (departure_date) filters.departure_date = departure_date;

    const result = await getAllTripsRepository(limitPlusOne, offset, filters);

    const hasNextPage = result.length > limit;
    const trips = hasNextPage ? result.slice(0, limit) : result;

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trips retrieved successfully", req.path, 200, req.headers["user-agent"]);

    return res.status(200).json({
      status: "success",
      currentPage: page,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
      totalTrips: trips.length,
      data: trips
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getTripByIdController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const trip = await getTripByIdRepository(id);

    if (!trip) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "INFO", req.ip, req.method, "Trip not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ message: "Trip not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trip retrieved successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json(trip);
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const updateTripController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const trip = await updateTripRepository(id, updateData);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trip updated successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      message: "Trip updated successfully",
      trip
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    
    if (error.message === 'Trip not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteTripController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const result = await deleteTripRepository(id);

    if (!result) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Trip not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Trip not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trip soft-deleted successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getTripsByVehicleController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { vehicleId } = req.params;

    if (!vehicleId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing vehicle ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Vehicle ID is required" });
    }

    const trips = await getTripsByVehicleRepository(vehicleId);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trips by vehicle retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: trips.length,
      data: trips
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const searchTripsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { q } = req.query;
    const searchQuery = q?.trim() || "";

    if (!searchQuery) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing search query", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Search query is required" });
    }

    const trips = await searchTripsRepository(searchQuery);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Trips searched successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: trips.length,
      data: trips
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableSeatsForTripController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { tripId } = req.params;

    if (!tripId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const seats = await getAvailableSeatsForTripRepository(tripId);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Available seats retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: seats.length,
      data: seats
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};