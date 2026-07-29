// routers/bookingSeatRoutes.js
import express from "express";
import {
  getBookingSeatsByBookingController,
  getBookingSeatByIdController,
  updateBookingSeatController,
  deleteBookingSeatController,
  getPassengersByTripController,
  searchPassengersController
} from "../Controllers/Booking_seat.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";
import { paginate } from "../Middleware/paginate.js";


const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// User routes
router.get("/booking/:bookingId", getBookingSeatsByBookingController);
router.get("/:id", getBookingSeatByIdController);

// Admin/Operator routes
router.get("/trip/:tripId/passengers", paginate, getPassengersByTripController);
router.get("/trip/:tripId/passengers/search", searchPassengersController);
router.put("/:id", updateBookingSeatController);
router.delete("/:id", deleteBookingSeatController);

export default router;