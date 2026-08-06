// routers/bookingRoutes.js
import express from "express";
import {
  initiateBookingPaymentController,
  verifyBookingPaymentController,
  paymentCallbackController,
  getBookingByIdController,
  getUserBookingsController,
  getAllBookingsController
} from "../Controllers/Booking.controller.js";
import { verifyToken } from "../Middleware/jwt_token_verification.js";
import { paginate } from "../Middleware/paginate.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Payment flow
router.post("/initiate-payment", initiateBookingPaymentController);
router.get("/verify-payment/:id", verifyBookingPaymentController);

// User routes
router.get("/user", paginate, getUserBookingsController);

// Admin/Operator routes
router.get("/all", paginate, getAllBookingsController);
router.get("/:id", getBookingByIdController);

// Public webhook for payment callbacks (no auth required)
router.post("/payment-callback", paymentCallbackController);

export default router;