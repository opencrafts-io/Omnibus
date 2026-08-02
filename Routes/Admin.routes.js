// routers/adminDashboardRoutes.js
import express from "express";
import {
  getAdminDashboardStatsController,
  getRevenueDataController,
  getRecentBookingsAdminController,
  getTopRoutesController,
  getFleetStatusController,
  getAdminDashboardSummaryController,
  searchBookingsAdminController
} from "../Controllers/Admin.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";

const router = express.Router();

// All admin dashboard routes require authentication and admin role
router.use(verifyToken);

// Admin dashboard overview
router.get("/summary", getAdminDashboardSummaryController);
router.get("/stats", getAdminDashboardStatsController);
router.get("/revenue", getRevenueDataController);
router.get("/recent-bookings", getRecentBookingsAdminController);
router.get("/top-routes", getTopRoutesController);
router.get("/fleet-status", getFleetStatusController);

// Search
router.get("/search", searchBookingsAdminController);

export default router;