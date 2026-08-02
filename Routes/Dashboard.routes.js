// routers/dashboardRoutes.js
import express from "express";
import {
  getDashboardStatsController,
  getLastTicketController,
  getUpcomingTripsController,
  getRecentBookingsController,
  getSeatLayoutController,
  getTravelStatsController
} from "../Controllers/Dashboard.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";

const router = express.Router();

// All dashboard routes require authentication
router.use(verifyToken);

// Dashboard overview
router.get("/stats", getDashboardStatsController);
router.get("/last-ticket", getLastTicketController);
router.get("/upcoming-trips", getUpcomingTripsController);
router.get("/recent-bookings", getRecentBookingsController);
router.get("/travel-stats", getTravelStatsController);

// Seat layout for a specific trip
router.get("/seat-layout/:tripId", getSeatLayoutController);

export default router;