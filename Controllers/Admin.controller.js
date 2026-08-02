// controllers/adminDashboardController.js
import {
  getAdminDashboardStatsRepository,
  getRevenueDataRepository,
  getRecentBookingsAdminRepository,
  getTopRoutesRepository,
  getFleetStatusRepository,
  getAdminDashboardSummaryRepository,
  searchBookingsAdminRepository
} from "../Repositories/Admin.repository.js";
import { logs } from "../Utils/logs.js";

export const getAdminDashboardStatsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { dateRange = 'month' } = req.query;

    const stats = await getAdminDashboardStatsRepository(dateRange);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Admin dashboard stats retrieved", req.path, 200, req.headers["user-agent"]);

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

export const getRevenueDataController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const revenue = await getRevenueDataRepository();

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Revenue data retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      data: revenue
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getRecentBookingsAdminController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { limit = 10 } = req.query;

    const bookings = await getRecentBookingsAdminRepository(parseInt(limit));

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

export const getTopRoutesController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { limit = 5 } = req.query;

    const routes = await getTopRoutesRepository(parseInt(limit));

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Top routes retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      count: routes.length,
      data: routes
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getFleetStatusController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const fleet = await getFleetStatusRepository();

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Fleet status retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      count: fleet.length,
      data: fleet
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const getAdminDashboardSummaryController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const summary = await getAdminDashboardSummaryRepository();

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Admin dashboard summary retrieved", req.path, 200, req.headers["user-agent"]);

    res.status(200).json({
      status: "success",
      data: summary
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

export const searchBookingsAdminController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Search query too short", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const bookings = await searchBookingsAdminRepository(q.trim());

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, `Search results: ${bookings.length} bookings found`, req.path, 200, req.headers["user-agent"]);

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