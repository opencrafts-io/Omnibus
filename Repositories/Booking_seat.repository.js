// repositories/bookingSeatRepository.js
import { BookingSeat, Booking, TripSeat , User } from "../Models/index.js";
import { Op } from "sequelize";

export const createBookingSeatRepository = async (bookingSeatData, options = {}) => {
  try {
    const bookingSeat = await BookingSeat.create(bookingSeatData, options);
    return bookingSeat;
  } catch (error) {
    throw error;
  }
};

export const bulkCreateBookingSeatsRepository = async (bookingSeatsData, options = {}) => {
  try {
    const bookingSeats = await BookingSeat.bulkCreate(bookingSeatsData, options);
    return bookingSeats;
  } catch (error) {
    throw error;
  }
};

export const getBookingSeatsByBookingRepository = async (bookingId) => {
  try {
    const bookingSeats = await BookingSeat.findAll({
      where: { booking_id: bookingId },
      include: [
        {
          model: Booking,
          as: "booking",
          attributes: ["id", "status" , "booking_date" , "special_requests"]
        }
      ],
      order: [["created_at", "ASC"]]
    });
    return bookingSeats;
  } catch (error) {
    throw error;
  }
};

export const getBookingSeatByIdRepository = async (bookingSeatId) => {
  try {
    const bookingSeat = await BookingSeat.findByPk(bookingSeatId, {
      include: [
        {
          model: Booking,
          as: "booking"
        }
      ]
    });
    return bookingSeat;
  } catch (error) {
    throw error;
  }
};

export const updateBookingSeatRepository = async (bookingSeatId, bookingSeatData) => {
  try {
    const bookingSeat = await BookingSeat.findByPk(bookingSeatId);
    if (!bookingSeat) {
      throw new Error('Booking seat not found');
    }
    await bookingSeat.update(bookingSeatData);
    return bookingSeat;
  } catch (error) {
    throw error;
  }
};

export const deleteBookingSeatRepository = async (bookingSeatId) => {
  try {
    const bookingSeat = await BookingSeat.findByPk(bookingSeatId);
    if (!bookingSeat) {
      return null;
    }
    await bookingSeat.destroy();
    return bookingSeat;
  } catch (error) {
    throw error;
  }
};

// repositories/bookingSeatRepository.js

export const getPassengersByTripRepository = async (tripId) => {
  try {
    const passengers = await BookingSeat.findAll({
      include: [
        {
          model: Booking,
          as: "booking",
          where: {
            trip_id: tripId,
            status: "CONFIRMED"
          },
          include: [
            {
              model: User,
              as: "user",
              attributes: ["email", "name", "phone"]
            }
          ],
        }
      ],
      attributes: ["id", "seat_number", "passenger_name", "passenger_gender", "passenger_contact"],
      
    });
    return passengers;
  } catch (error) {
    throw error;
  }
};

export const searchPassengersRepository = async (tripId, searchQuery) => {
  try {
    const passengers = await BookingSeat.findAll({
      where: {
        passenger_name: { [Op.iLike]: `%${searchQuery}%` }
      },
      include: [
        {
          model: Booking,
          as: "booking",
          where: {
            trip_id: tripId,
            status: "CONFIRMED"
          }
        }
      ]
    });
    return passengers;
  } catch (error) {
    throw error;
  }
};