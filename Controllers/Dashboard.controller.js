// controllers/dashboardController.js
import {
  getUserDashboardStatsRepository,
  getLastTicketRepository,
  getUpcomingTripsRepository,
  getRecentBookingsRepository,
  getAvailableSeatsForTripRepository,
  getDashboardSeatLayoutRepository,
  getUserTravelStatsRepository
} from "../Repositories/Dashboard.repository.js";
import { logs } from "../Utils/logs.js";

export const getDashboardStatsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user?.sub;

    if (!user_id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "User ID not found", req.path, 401, req.headers["user-agent"]);
      return res.status(401).json({ error: "User not authenticated" });
    }

    const stats = await getUserDashboardStatsRepository(user_id);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Dashboard stats retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      data: stats
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getLastTicketController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user?.sub;

    if (!user_id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "User ID not found", req.path, 401, req.headers["user-agent"]);
      return res.status(401).json({ error: "User not authenticated" });
    }

    const lastTicket = await getLastTicketRepository(user_id);

    if (!lastTicket) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "INFO", req.ip, req.method, "No tickets found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ message: "No tickets found" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Last ticket retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      data: lastTicket
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getUpcomingTripsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user?.sub;
    const { limit = 5 } = req.query;

    if (!user_id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "User ID not found", req.path, 401, req.headers["user-agent"]);
      return res.status(401).json({ error: "User not authenticated" });
    }

    const trips = await getUpcomingTripsRepository(user_id, parseInt(limit));

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Upcoming trips retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      count: trips.length,
      data: trips
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getRecentBookingsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user?.sub;
    const { limit = 5 } = req.query;

    if (!user_id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "User ID not found", req.path, 401, req.headers["user-agent"]);
      return res.status(401).json({ error: "User not authenticated" });
    }

    const bookings = await getRecentBookingsRepository(user_id, parseInt(limit));

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Recent bookings retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getSeatLayoutController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { tripId } = req.params;

    if (!tripId) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Trip ID required", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Trip ID is required" });
    }

    const layout = await getDashboardSeatLayoutRepository(tripId);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Seat layout retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      data: layout
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getTravelStatsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user?.sub;

    if (!user_id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "User ID not found", req.path, 401, req.headers["user-agent"]);
      return res.status(401).json({ error: "User not authenticated" });
    }

    const stats = await getUserTravelStatsRepository(user_id);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Travel stats retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      data: stats
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};