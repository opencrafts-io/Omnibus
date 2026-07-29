// routers/tripSeatRoutes.js
import express from "express";
import {
  getSeatByIdController,
  getSeatsByTripController,
  updateSeatAvailabilityController,
  getSeatsBookedByUserController
} from "../Controllers/Trip_seat.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";
import { paginate } from "../Middleware/paginate.js";


const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// User routes
router.get("/trip/:tripId", paginate, getSeatsByTripController);
router.get("/user/booked", getSeatsBookedByUserController);
router.get("/:id", getSeatByIdController);

// Admin/Operator routes
router.put("/:id/availability", updateSeatAvailabilityController);

export default router;