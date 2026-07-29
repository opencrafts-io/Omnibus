// controllers/tripSeatController.js
import {
  getSeatByIdRepository,
  getSeatsByTripRepository,
  updateSeatAvailabilityRepository,
  getSeatsBookedByUserRepository
} from "../Repositories/Trip_seat.repository.js";
import { logs } from "../Utils/logs.js";

export const getSeatByIdController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing seat ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Seat ID is required" });
    }

    const seat = await getSeatByIdRepository(id);

    if (!seat) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "INFO", req.ip, req.method, "Seat not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ message: "Seat not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Seat retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json(seat);
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getSeatsByTripController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { tripId } = req.params;

    if (!tripId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const seats = await getSeatsByTripRepository(tripId);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Seats retrieved", req.path, 200, req.headers["user-agent"]);

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

export const updateSeatAvailabilityController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;
    const { is_available } = req.body;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing seat ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Seat ID is required" });
    }

    if (is_available === undefined) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing availability status", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Availability status is required" });
    }

    const seat = await updateSeatAvailabilityRepository(id, is_available);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Seat availability updated", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      message: "Seat availability updated successfully",
      seat
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    
    if (error.message === 'Seat not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getSeatsBookedByUserController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user.sub;

    const seats = await getSeatsBookedByUserRepository(user_id);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "User's booked seats retrieved", req.path, 200, req.headers["user-agent"]);

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