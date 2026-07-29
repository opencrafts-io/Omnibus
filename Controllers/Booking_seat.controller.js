// controllers/bookingSeatController.js
import {
  getBookingSeatsByBookingRepository,
  getBookingSeatByIdRepository,
  updateBookingSeatRepository,
  deleteBookingSeatRepository,
  getPassengersByTripRepository,
  searchPassengersRepository
} from "../Repositories/Booking_seat.repository.js";
import { logs } from "../Utils/logs.js";

export const getBookingSeatsByBookingController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing booking ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const bookingSeats = await getBookingSeatsByBookingRepository(bookingId);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Booking seats retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: bookingSeats.length,
      data: bookingSeats
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getBookingSeatByIdController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing booking seat ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Booking seat ID is required" });
    }

    const bookingSeat = await getBookingSeatByIdRepository(id);

    if (!bookingSeat) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "INFO", req.ip, req.method, "Booking seat not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ message: "Booking seat not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Booking seat retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json(bookingSeat);
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const updateBookingSeatController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing booking seat ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Booking seat ID is required" });
    }

    const bookingSeat = await updateBookingSeatRepository(id, updateData);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Booking seat updated", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      message: "Booking seat updated successfully",
      bookingSeat
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    
    if (error.message === 'Booking seat not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteBookingSeatController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing booking seat ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Booking seat ID is required" });
    }

    const result = await deleteBookingSeatRepository(id);

    if (!result) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Booking seat not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Booking seat not found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Booking seat deleted", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({ message: "Booking seat deleted successfully" });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getPassengersByTripController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { tripId } = req.params;

    if (!tripId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const passengers = await getPassengersByTripRepository(tripId);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Passengers retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: passengers.length,
      data: passengers
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const searchPassengersController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { tripId } = req.params;
    const { q } = req.query;
    const searchQuery = q?.trim() || "";

    if (!tripId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing trip ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    if (!searchQuery) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing search query", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Search query is required" });
    }

    const passengers = await searchPassengersRepository(tripId, searchQuery);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Passengers searched", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      count: passengers.length,
      data: passengers
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};