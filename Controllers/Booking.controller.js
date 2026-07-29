// controllers/bookingController.js
import {
  createBookingRepository,
  getBookingByIdRepository,
  getBookingByReferenceRepository,
  getUserBookingsRepository,
  getUpcomingUserBookingsRepository,
  getTripBookingsRepository,
  updateBookingRepository,
  cancelBookingRepository,
  getBookingStatisticsRepository,
  getTotalBookingsForTripRepository,
  getTransactionByBookingIdRepository
} from "../Repositories/Booking.repository.js";
import {
  bookSeatsRepository,
  releaseSeatsRepository,
  getSeatsByBookingRepository
} from "../Repositories/Trip_seat.repository.js";
import { bulkCreateBookingSeatsRepository } from "../Repositories/Booking_seat.repository.js";
import { getTripByIdRepository, getAvailableSeatsForTripRepository } from "../Repositories/Trip.repository.js";
import { getVehicleByIdRepository } from "../Repositories/Vehicle.repository.js";
import { 
  createTransactionRepository, 
  getTransactionByIdRepository,
  updateTransactionRepository 
} from "../Repositories/Transactions.repository.js";
import { sendPaymentRequest } from '../Services/Veribroke_sdk_push.js';
import { logs } from "../Utils/logs.js";
import { Trip, Booking } from "../Models/index.js";
import { Op, Sequelize } from "sequelize";

const LEOPHORIO_ROUTING_KEY = process.env.LEOPHORIO_ROUTING_KEY || "io.opencrafts.leophorio-mpesa";

// ==================== INITIATE BOOKING PAYMENT ====================
export const initiateBookingPaymentController = async (req, res) => {
  const start = process.hrtime.bigint();
  let dbTransaction = await Trip.sequelize.transaction();

  try {
    const user_id = req.user?.sub;
    const { 
      trip_id, 
      seat_ids, 
      passengers, 
      payment_method = 'MPESA',
      phone_number 
    } = req.body;

    // Validate required fields
    if (!user_id || !trip_id || !seat_ids || !seat_ids.length || !passengers || !passengers.length) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing required fields", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ 
        error: "User ID, Trip ID, Seat IDs, and Passenger details are required" 
      });
    }

    // Check if trip exists and get trip details
    const trip = await getTripByIdRepository(trip_id);
    if (!trip) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Trip not found", req.path, 404, req.headers["user-agent"]);
      await dbTransaction.rollback();
      return res.status(404).json({ error: "Trip not found" });
    }

    // Check if trip is available for booking
    if (trip.status !== 'SCHEDULED') {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Trip not available for booking", req.path, 400, req.headers["user-agent"]);
      await dbTransaction.rollback();
      return res.status(400).json({ error: `Trip is ${trip.status.toLowerCase()} and cannot be booked` });
    }

    // Check seat availability
    const availableSeats = await getAvailableSeatsForTripRepository(trip_id);
    const availableSeatIds = availableSeats.map(seat => seat.id);
    const allSeatsAvailable = seat_ids.every(id => availableSeatIds.includes(id));

    if (!allSeatsAvailable) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Some seats are already booked", req.path, 409, req.headers["user-agent"]);
      await dbTransaction.rollback();
      return res.status(409).json({ error: "Some seats are already booked" });
    }

    // Calculate total amount
    const selectedSeats = availableSeats.filter(seat => seat_ids.includes(seat.id));
    
    // Calculate total amount using individual seat prices

    // TODO: test here 
    let total_amount = 0;
    const seatPriceDetails = [];
    
    for (const seat of selectedSeats) {
      // Use seat price if available, otherwise fall back to base price
      const seatPrice = seat.price ? parseFloat(seat.price) : parseFloat(trip.base_price);
      total_amount += seatPrice;
      
      seatPriceDetails.push({
        seat_id: seat.id,
        seat_number: seat.seat_number,
        price: seatPrice,
        used_base_price: !seat.price // Flag to indicate if we used base price
      });
    }


    // Get vehicle for operator info
    const vehicle = await getVehicleByIdRepository(trip.vehicle.dataValues.id);
    if (!vehicle) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Vehicle not found", req.path, 404, req.headers["user-agent"]);
      await dbTransaction.rollback();
      return res.status(404).json({ error: "Vehicle not found" });
    }

    // Generate booking reference
    const booking_reference = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create booking with PENDING status
    const booking = await createBookingRepository({
      user_id,
      trip_id,
      total_amount,
      status: 'PENDING',
      payment_status: 'PENDING',
      payment_method: payment_method,
      booking_date: new Date(),
      passenger_count: passengers.length,
      booking_reference
    }, { transaction: dbTransaction });

    // Reserve seats (mark as unavailable but with booking_id pending)
    await bookSeatsRepository(seat_ids, booking.dataValues.id, user_id, { transaction: dbTransaction });

    // Add passenger details
    const passengerData = passengers.map((p, index) => ({
      booking_id: booking.id,
      seat_number: p.seat_number || `SEAT-${index + 1}`,
      passenger_name: p.name,
      passenger_gender: p.gender || null,
      passenger_contact: p.contact || null
    }));
    await bulkCreateBookingSeatsRepository(passengerData, { transaction: dbTransaction });

    // Create transaction record
    const transaction = await createTransactionRepository({
      user_id,
      booking_id: booking.id,
      trip_id: trip_id,
      amount: total_amount,
      currency: 'KES',
      payment_method: payment_method,
      status: 'PENDING',
      phone_number: phone_number || null,
      booking_reference: booking_reference
    }, { transaction: dbTransaction });

    // If payment method is MPESA, initiate STK push
    if (payment_method === 'MPESA' && phone_number) {
      let formattedPhone = phone_number.toString().trim();
      
      // Format phone number
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "254" + formattedPhone.slice(1);
      } else if (formattedPhone.startsWith("+")) {
        formattedPhone = formattedPhone.slice(1);
      }

      const paymentData = {
        "request_id": transaction.id,
        "phone_number": formattedPhone,
        "target_user_id": user_id,
        "trans_amount": total_amount,
        "service_name": "LEOPHORIO",
        "trans_desc": `Bus booking: ${seat_ids.length} seat(s) from ${trip.departure_location} to ${trip.arrival_location}`,
        "reply_to": LEOPHORIO_ROUTING_KEY,
        "split_data": {
          "originator": "MPESA",
          "extras": {
            "type": "paybill",
            "amount": Math.floor(0.13 * total_amount) || 1,
            "recipient": process.env.PAYBILL_NUMBER || "123456",
            "account_reference": booking_reference,
            "occassion": "Bus booking payment"
          },
        },
      };

      try {
        await sendPaymentRequest(paymentData);
        const duration = Number(process.hrtime.bigint() - start) / 1000;
        logs(duration, "INFO", req.ip, req.method, "Payment request sent", req.path, 201, req.headers["user-agent"]);
        
        await dbTransaction.commit();
        
        return res.status(200).json({
          message: "Payment initiated successfully",
          booking_id: booking.id,
          booking_reference: booking_reference,
          transaction_id: transaction.id,
          status: "PENDING",
          amount: total_amount,
          seats: seat_ids.length
        });
      } catch (error) {
        // If payment fails, rollback everything
        await dbTransaction.rollback();
        const duration = Number(process.hrtime.bigint() - start) / 1000;
        logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
        return res.status(500).json({ 
          error: "Payment initiation failed", 
          details: error.message 
        });
      }
    } else if (payment_method === 'CASH' || payment_method === 'BANK' || payment_method === 'CARD') {
      // For non-MPESA payments, keep booking as PENDING until payment is confirmed manually
      await dbTransaction.commit();
      
      return res.status(200).json({
        message: "Booking created. Awaiting payment confirmation.",
        booking_id: booking.id,
        booking_reference: booking_reference,
        transaction_id: transaction.id,
        status: "PENDING",
        amount: total_amount,
        payment_method: payment_method
      });
    } else {
      // No phone number provided for MPESA
      await dbTransaction.rollback();
      return res.status(400).json({
        error: "Phone number is required for MPESA payments"
      });
    }

  } catch (error) {
    if (!dbTransaction.finished) {
      await dbTransaction.rollback();
    }
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

// ==================== VERIFY BOOKING PAYMENT ====================
export const verifyBookingPaymentController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const user_id = req.user?.sub;
    const { id } = req.params; // booking_id or transaction_id

    if (!user_id || !id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing required fields", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "User ID and Booking ID are required" });
    }

    // Get the booking
    const booking = await getBookingByIdRepository(id);
    
    if (!booking) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Booking not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user owns this booking
    if (booking.user_id !== user_id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Unauthorized access", req.path, 403, req.headers["user-agent"]);
      return res.status(403).json({ error: "Unauthorized to view this booking" });
    }

    // Find the transaction for this booking
    const transaction = await getTransactionByBookingIdRepository(booking.id);
    
    if (!transaction) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Transaction not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Transaction not found for this booking" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, `Payment status: ${transaction.status}`, req.path, 200, req.headers["user-agent"]);

    // If payment is successful, booking should be confirmed
    if (transaction.status === 'SUCCESS' && booking.status === 'PENDING') {
      // Update booking status to CONFIRMED
      await updateBookingRepository(booking.id, {
        status: 'CONFIRMED',
        payment_status: 'PAID'
      });

      // Update the booking to confirmed
      const confirmedBooking = await getBookingByIdRepository(booking.id);
      
      return res.status(200).json({
        status: "SUCCESS",
        message: "Payment confirmed. Booking is now confirmed.",
        booking: confirmedBooking,
        transaction: transaction
      });
    }

    // If payment failed, booking should be cancelled and seats released
    if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED' || transaction.status === 'REVERSED') {
      if (booking.status === 'PENDING') {
        // Cancel the booking
        await cancelBookingRepository(booking.id);
        
        // Get updated booking
        const cancelledBooking = await getBookingByIdRepository(booking.id);
        
        return res.status(200).json({
          status: transaction.status,
          message: "Payment failed. Booking has been cancelled.",
          booking: cancelledBooking,
          transaction: transaction
        });
      }
    }

    // Return current status
    res.status(200).json({
      status: transaction.status,
      booking_status: booking.status,
      payment_status: booking.payment_status,
      transaction: transaction,
    });

  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

// ==================== WEBHOOK FOR PAYMENT CALLBACKS ====================
export const paymentCallbackController = async (req, res) => {
  const start = process.hrtime.bigint();
  let dbTransaction = await Booking.sequelize.transaction();

  try {
    const { 
      request_id, // transaction_id
      status, // SUCCESS, FAILED, CANCELLED, REVERSED
      transaction_reference,
      provider_response,
      failure_reason,
      phone_number
    } = req.body;

    if (!request_id || !status) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing required fields in callback", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the transaction
    const transaction = await getTransactionByIdRepository(request_id);
    
    if (!transaction) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Transaction not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Update transaction
    await updateTransactionRepository(request_id, {
      status: status,
      transaction_reference: transaction_reference || transaction.transaction_reference,
      provider_response: provider_response || {},
      failure_reason: failure_reason || null,
      updated_at: new Date()
    }, { transaction: dbTransaction });

    // If payment is successful, confirm the booking
    if (status === 'SUCCESS' && transaction.booking_id) {
      const booking = await getBookingByIdRepository(transaction.booking_id);
      
      if (booking && booking.status === 'PENDING') {
        // Update booking to CONFIRMED
        await updateBookingRepository(booking.id, {
          status: 'CONFIRMED',
          payment_status: 'PAID'
        }, { transaction: dbTransaction });

        // Update trip available seats
        const trip = await getTripByIdRepository(booking.trip_id);
        if (trip) {
          const seatCount = await getSeatsByBookingRepository(booking.id);
          await trip.update({
            available_seats: trip.available_seats - seatCount.length
          }, { transaction: dbTransaction });
        }

        const duration = Number(process.hrtime.bigint() - start) / 1000;
        logs(duration, "INFO", req.ip, req.method, "Booking confirmed via callback", req.path, 200, req.headers["user-agent"]);
      }
    }

    // If payment failed, cancel the booking and release seats
    if ((status === 'FAILED' || status === 'CANCELLED' || status === 'REVERSED') && transaction.booking_id) {
      const booking = await getBookingByIdRepository(transaction.booking_id);
      
      if (booking && booking.status === 'PENDING') {
        // Cancel the booking (this releases seats)
        await cancelBookingRepository(booking.id);
        
        const duration = Number(process.hrtime.bigint() - start) / 1000;
        logs(duration, "WARN", req.ip, req.method, "Booking cancelled due to failed payment", req.path, 200, req.headers["user-agent"]);
      }
    }

    await dbTransaction.commit();

    res.status(200).json({
      message: "Callback processed successfully",
      status: status
    });

  } catch (error) {
    if (!dbTransaction.finished) {
      await dbTransaction.rollback();
    }
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

// ==================== GET BOOKING BY ID ====================
export const getBookingByIdController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { id } = req.params;

    if (!id) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Missing booking ID", req.path, 400, req.headers["user-agent"]);
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const booking = await getBookingByIdRepository(id);

    if (!booking) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "INFO", req.ip, req.method, "Booking not found", req.path, 404, req.headers["user-agent"]);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns this booking or is admin
    const user_id = req.user?.sub;
    const user_role = req.user?.role;
    
    if (booking.user_id !== user_id && !['ADMIN', 'SUPER_ADMIN'].includes(user_role)) {
      const duration = Number(process.hrtime.bigint() - start) / 1000;
      logs(duration, "WARN", req.ip, req.method, "Unauthorized access", req.path, 403, req.headers["user-agent"]);
      return res.status(403).json({ error: "Unauthorized to view this booking" });
    }

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "Booking retrieved successfully", req.path, 200, req.headers["user-agent"]);

    res.status(200).json(booking);
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};

// ==================== GET USER BOOKINGS ====================
export const getUserBookingsController = async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const { limit, page, limitPlusOne, offset } = req.pagination;
    const user_id = req.user.sub;

    const result = await getUserBookingsRepository(user_id, limitPlusOne, offset);

    const hasNextPage = result.length > limit;
    const bookings = hasNextPage ? result.slice(0, limit) : result;

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", req.ip, req.method, "User bookings retrieved", req.path, 200, req.headers["user-agent"]);

    return res.status(200).json({
      status: "success",
      currentPage: page,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: page > 1 ? page - 1 : null,
      totalBookings: bookings.length,
      data: bookings
    });
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", req.ip, req.method, error.message, req.path, 500, req.headers["user-agent"]);
    res.status(500).json({ error: error.message });
  }
};