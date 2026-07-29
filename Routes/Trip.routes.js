// routers/tripRoutes.js
import express from "express";
import {
  createTripController,
  getAllTripsController,
  getTripByIdController,
  updateTripController,
  deleteTripController,
  getTripsByVehicleController,
  searchTripsController,
  getAvailableSeatsForTripController
} from "../Controllers/Trip.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";
import { paginate } from "../Middleware/paginate.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Public routes (accessible to all authenticated users)

router.get("/search", searchTripsController);
router.get("/id/:id", getTripByIdController);
router.get("/vehicle/:vehicleId", getTripsByVehicleController);
router.get("/:tripId/seats/available", getAvailableSeatsForTripController);
router.get("/", paginate, getAllTripsController);

// Admin/Operator only routes
router.post("/", createTripController);
router.put("/:id", updateTripController);
router.delete("/:id", deleteTripController);

export default router;