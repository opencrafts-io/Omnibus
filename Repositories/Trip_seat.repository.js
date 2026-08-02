// repositories/tripSeatRepository.js
import { TripSeat, Trip, Vehicle, Booking , User , BookingSeat } from "../Models/index.js";
import { Op } from "sequelize";

export const createTripSeatRepository = async (seatData, options = {}) => {
  try {
    const seat = await TripSeat.create(seatData, options);
    return seat;
  } catch (error) {
    throw error;
  }
};

export const bulkCreateTripSeatsRepository = async (seatsData, options = {}) => {
  try {
    const seats = await TripSeat.bulkCreate(seatsData, options);
    return seats;
  } catch (error) {
    throw error;
  }
};

// repositories/tripSeatRepository.js

// repositories/tripSeatRepository.js

export const getSeatByIdRepository = async (seatId) => {
  try {
    const seat = await TripSeat.findByPk(seatId, {
      attributes: {
        exclude: ["vehicle_id", "trip_id", "booking_id", "booked_by"]
      },
      include: [
        {
          model: Trip,
          as: "trip",
          attributes: {
            exclude: ["vehicle_id"]
          },
          include: [
            {
              model: Vehicle,
              as: "vehicle"
            }
          ]
        },
        {
          model: Booking,
          as: "booking",
          attributes: ["id", "status", "special_requests", "booking_date", "payment_method"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "email", "name", "phone"]
            }
          ]
        }
      ]
    });

    if (!seat) {
      return null;
    }

    const seatData = seat.toJSON();

    // If the seat is booked, get passenger details for this specific seat
    if (seatData.booking && seatData.is_available === false) {
      const passenger = await BookingSeat.findOne({
        where: {
          booking_id: seatData.booking.id,
          seat_number: seatData.seat_number
        },
        attributes: [
          "id", 
          "seat_number", 
          "passenger_name", 
          "passenger_gender", 
          "passenger_contact"
        ]
      });

      if (passenger) {
        seatData.passenger = passenger.toJSON();
      }
    }

    return seatData;
  } catch (error) {
    console.error('Error in getSeatByIdRepository:', error);
    throw error;
  }
};

export const getSeatsByTripRepository = async (tripId) => {
  try {
    const seats = await TripSeat.findAll({
      where: { trip_id: tripId },
      order: [
        ["seat_row", "ASC"],
        ["seat_column", "ASC"]
      ]
    });
    return seats;
  } catch (error) {
    throw error;
  }
};

export const updateSeatAvailabilityRepository = async (seatId, isAvailable) => {
  try {
    const seat = await TripSeat.findByPk(seatId);
    if (!seat) {
      throw new Error('Seat not found');
    }
    await seat.update({ is_available: isAvailable });
    return seat;
  } catch (error) {
    throw error;
  }
};

// repositories/Trip_seat.repository.js
export const bookSeatsRepository = async (seatIds, bookingId, userId, options = {}) => {
  try {
    
    const [updatedCount] = await TripSeat.update(
      {
        is_available: false,
        booking_id: bookingId,
        booked_by: userId
      },
      {
        where: {
          id: { [Op.in]: seatIds },
          is_available: true
        },
        ...options // Pass transaction options
      }
    );
    
    if (updatedCount !== seatIds.length) {
      throw new Error(`Some seats are already booked or invalid. Expected ${seatIds.length}, updated ${updatedCount}`);
    }
    
    return updatedCount;
  } catch (error) {
    throw error;
  }
};

export const releaseSeatsRepository = async (bookingId) => {
  try {
    const [updatedCount] = await TripSeat.update(
      {
        is_available: true,
        booking_id: null,
        booked_by: null
      },
      {
        where: {
          booking_id: bookingId
        }
      }
    );
    return updatedCount;
  } catch (error) {
    throw error;
  }
};

export const getSeatsByBookingRepository = async (bookingId) => {
  try {
    const seats = await TripSeat.findAll({
      where: { booking_id: bookingId },
      attributes: ["id", "seat_number", "seat_row", "seat_column", "seat_type", "price"]
    });
    return seats;
  } catch (error) {
    throw error;
  }
};

export const getSeatsBookedByUserRepository = async (userId) => {
  try {
    const seats = await TripSeat.findAll({
      where: {
        booked_by: userId,
        is_available: false
      },
      // Exclude foreign keys from the top-level TripSeat object
      attributes: {
        exclude: ["vehicle_id", "trip_id", "booking_id", "booked_by"]
      },
      include: [
        {
          model: Trip,
          as: "trip",
          // Exclude foreign key from nested Trip object
          attributes: {
            exclude: ["vehicle_id"]
          },
          include: [
            {
              model: Vehicle,
              as: "vehicle"
            }
          ]
        },
        {
          model: Booking,
          as: "booking",
          // Exclude foreign keys from nested Booking object
          attributes: {
            exclude: ["trip_id", "user_id"]
          }
        }
      ],
      order: [["created_at", "DESC"]]
    });

    return seats;
  } catch (error) {
    throw error;
  }
};