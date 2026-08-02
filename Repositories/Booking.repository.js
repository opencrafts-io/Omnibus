// repositories/bookingRepository.js
import { Booking, User, Trip, Vehicle, TripSeat, BookingSeat , Transaction } from "../Models/index.js";
import { Op, Sequelize } from "sequelize";

export const createBookingRepository = async (bookingData, options = {}) => {
  try {
    const booking = await Booking.create(bookingData, options);
    return booking;
  } catch (error) {
    throw error;
  }
};

export const getBookingByIdRepository = async (bookingId) => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "name", "phone"]
        },
        {
          model: Trip,
          as: "trip",
          include: [
            {
              model: Vehicle,
              as: "vehicle"
            }
          ]
        },
        {
          model: TripSeat,
          as: "seats",
          attributes: ["id", "seat_number", "seat_row", "seat_column", "seat_type", "price"]
        },
        {
          model: BookingSeat,
          as: "passengers",
          attributes: ["id", "seat_number", "passenger_name", "passenger_gender", "passenger_contact"]
        }
      ]
    });
    return booking;
  } catch (error) {
    throw error;
  }
};

export const getBookingByReferenceRepository = async (bookingReference) => {
  try {
    const booking = await Booking.findOne({
      where: { booking_reference: bookingReference },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "name", "phone"]
        },
        {
          model: Trip,
          as: "trip",
          include: [
            {
              model: Vehicle,
              as: "vehicle"
            }
          ]
        },
        {
          model: TripSeat,
          as: "seats"
        }
      ]
    });
    return booking;
  } catch (error) {
    throw error;
  }
};

export const getUserBookingsRepository = async (userId, limitPlusOne, offset) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: userId },
      order: [["booking_date", "DESC"]],
      limit: limitPlusOne,
      offset,
      include: [
        {
          model: Trip,
          as: "trip",
          include: [
            {
              model: Vehicle,
              as: "vehicle",
              attributes: ["operator_name", "vehicle_type", "service_class" , "registration_number"]
            }
          ]
        },
        {
          model: TripSeat,
          as: "seats",
          attributes: ["id", "seat_number", "seat_type", "price"]
        },
        {
          model: BookingSeat,
          as: "passengers",
          attributes: ["id", "seat_number", "passenger_name" , "passenger_gender", "passenger_contact"]
        }
      ]
    });
    return bookings;
  } catch (error) {
    throw error;
  }
};

export const getUpcomingUserBookingsRepository = async (userId) => {
  try {
    const now = new Date();
    const bookings = await Booking.findAll({
      where: {
        user_id: userId,
        status: { [Op.in]: ["CONFIRMED", "PENDING"] }
      },
      include: [
        {
          model: Trip,
          as: "trip",
          where: {
            departure_time: { [Op.gte]: now }
          },
          include: [
            {
              model: Vehicle,
              as: "vehicle"
            }
          ]
        },
        {
          model: TripSeat,
          as: "seats"
        }
      ],
      order: [[{ model: Trip, as: "trip" }, "departure_time", "ASC"]]
    });
    return bookings;
  } catch (error) {
    throw error;
  }
};

export const getTripBookingsRepository = async (tripId, limitPlusOne, offset) => {
  try {
    const bookings = await Booking.findAll({
      where: { trip_id: tripId },
      order: [["booking_date", "DESC"]],
      limit: limitPlusOne,
      offset,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "name", "phone"]
        },
        {
          model: TripSeat,
          as: "seats",
          attributes: ["id", "seat_number", "seat_type", "price"]
        },
        {
          model: BookingSeat,
          as: "passengers"
        }
      ]
    });
    return bookings;
  } catch (error) {
    throw error;
  }
};

export const updateBookingRepository = async (bookingId, bookingData) => {
  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    await booking.update(bookingData);
    return booking;
  } catch (error) {
    throw error;
  }
};

export const cancelBookingRepository = async (bookingId) => {
  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Start a transaction
    const transaction = await Booking.sequelize.transaction();
    
    try {
      // Update booking status
      await booking.update({ status: "CANCELLED" }, { transaction });
      
      // Release seats
      await TripSeat.update(
        {
          is_available: true,
          booking_id: null,
          booked_by: null
        },
        {
          where: { booking_id: bookingId },
          transaction
        }
      );
      
      await transaction.commit();
      return booking;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

export const getBookingStatisticsRepository = async (startDate, endDate) => {
  try {
    const stats = await Booking.findAll({
      where: {
        booking_date: {
          [Op.between]: [startDate, endDate]
        },
        status: "CONFIRMED"
      },
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_bookings'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_revenue'],
        [Sequelize.fn('AVG', Sequelize.col('total_amount')), 'average_booking_value']
      ]
    });
    return stats;
  } catch (error) {
    throw error;
  }
};

export const getTotalBookingsForTripRepository = async (tripId) => {
  try {
    const count = await Booking.count({
      where: {
        trip_id: tripId,
        status: "CONFIRMED"
      }
    });
    return count;
  } catch (error) {
    throw error;
  }
};

export const getTransactionByBookingIdRepository = async (bookingId) => {
  try {
    const transaction = await Transaction.findOne({
      where: { booking_id: bookingId },
      attributes: {
        exclude: ['provider_response']
      }
    });
    return transaction;
  } catch (error) {
    throw error;
  }
};