// repositories/dashboardRepository.js
import { Op, Sequelize } from "sequelize";
import { Booking, Trip, TripSeat, BookingSeat, Vehicle, User, Transaction } from "../Models/index.js";

export const getUserDashboardStatsRepository = async (userId) => {
  try {
    // Get total bookings count
    const totalBookings = await Booking.count({
      where: { 
        user_id: userId,
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    // Get upcoming trips count
    const now = new Date();
    const upcomingTrips = await Booking.count({
      where: {
        user_id: userId,
        status: 'CONFIRMED'
      },
      include: [
        {
          model: Trip,
          as: 'trip',
          where: {
            departure_time: { [Op.gte]: now }
          }
        }
      ]
    });

    // Get total spent
    const totalSpent = await Booking.sum('total_amount', {
      where: {
        user_id: userId,
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] },
        payment_status: 'PAID'
      }
    });

    // Get last booking date
    const lastBooking = await Booking.findOne({
      where: { 
        user_id: userId,
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      },
      order: [['booking_date', 'DESC']],
      attributes: ['booking_date']
    });

    return {
      totalBookings: totalBookings || 0,
      upcomingTrips: upcomingTrips || 0,
      totalSpent: parseFloat(totalSpent || 0),
      lastBookingDate: lastBooking ? lastBooking.booking_date : null
    };
  } catch (error) {
    throw error;
  }
};

export const getLastTicketRepository = async (userId) => {
  try {
    const booking = await Booking.findOne({
      where: {
        user_id: userId,
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      },
      order: [['booking_date', 'DESC']],
      include: [
        {
          model: Trip,
          as: 'trip',
          include: [
            {
              model: Vehicle,
              as: 'vehicle'
            }
          ]
        },
        {
          model: TripSeat,
          as: 'seats',
          attributes: ['id', 'seat_number', 'seat_row', 'seat_column', 'seat_type', 'price']
        },
        {
          model: BookingSeat,
          as: 'passengers',
          attributes: ['id', 'seat_number', 'passenger_name', 'passenger_gender', 'passenger_contact']
        }
      ],
      attributes: [
        'id',
        'trip_id',
        'total_amount',
        'status',
        'booking_date',
        'payment_method',
        'payment_status'
      ]
    });

    if (!booking) return null;

    const bookingData = booking.toJSON();
    
    // Format the response
    return {
      id: bookingData.id,
      booking_reference: bookingData.booking_reference,
      total_amount: bookingData.total_amount,
      status: bookingData.status,
      booking_date: bookingData.booking_date,
      payment_method: bookingData.payment_method,
      payment_status: bookingData.payment_status,
      trip: {
        id: bookingData.trip.id,
        departure_location: bookingData.trip.departure_location,
        arrival_location: bookingData.trip.arrival_location,
        departure_time: bookingData.trip.departure_time,
        arrival_time: bookingData.trip.arrival_time,
        vehicle: bookingData.trip.vehicle
      },
      seats: bookingData.seats || [],
      passengers: bookingData.passengers || []
    };
  } catch (error) {
    throw error;
  }
};

// repositories/dashboardRepository.js
export const getUpcomingTripsRepository = async (userId, limit = 5) => {
  try {
    const now = new Date();
    
    const bookings = await Booking.findAll({
      where: {
        user_id: userId,
        status: 'CONFIRMED'
      },
      include: [
        {
          model: Trip,
          as: 'trip',
          where: {
            departure_time: { [Op.gte]: now }
          },
          include: [
            {
              model: Vehicle,
              as: 'vehicle'
            }
          ]
        },
        {
          model: TripSeat,
          as: 'seats',
          attributes: ['id', 'seat_number', 'seat_row', 'seat_column', 'seat_type']
        }
      ]
    });

    // Sort in JavaScript and limit
    const sortedBookings = bookings
      .sort((a, b) => {
        const timeA = a.trip ? new Date(a.trip.departure_time).getTime() : 0;
        const timeB = b.trip ? new Date(b.trip.departure_time).getTime() : 0;
        return timeA - timeB;
      })
      .slice(0, limit);

    return sortedBookings.map(booking => booking.toJSON());
  } catch (error) {
    console.error('Error in getUpcomingTripsRepository:', error);
    throw error;
  }
};

export const getRecentBookingsRepository = async (userId, limit = 5) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        user_id: userId
      },
      include: [
        {
          model: Trip,
          as: 'trip',
          attributes: ['id', 'departure_location', 'arrival_location', 'departure_time', 'arrival_time']
        },
        {
          model: TripSeat,
          as: 'seats',
          attributes: ['id', 'seat_number', 'seat_type']
        }
      ],
      order: [['booking_date', 'DESC']],
      limit: limit,
      attributes: [
        'id',
        'trip_id',
        'total_amount',
        'status',
        'payment_status',
        'booking_date',
        'passenger_count'
      ]
    });

    return bookings.map(booking => booking.toJSON());
  } catch (error) {
    throw error;
  }
};

export const getAvailableSeatsForTripRepository = async (tripId) => {
  try {
    const seats = await TripSeat.findAll({
      where: {
        trip_id: tripId,
        is_available: true
      },
      attributes: ['id', 'seat_number', 'seat_row', 'seat_column', 'seat_type', 'price'],
      order: [
        ['seat_row', 'ASC'],
        ['seat_column', 'ASC']
      ]
    });
    return seats;
  } catch (error) {
    throw error;
  }
};

export const getDashboardSeatLayoutRepository = async (tripId) => {
  try {
    const seats = await TripSeat.findAll({
      where: { trip_id: tripId },
      attributes: ['id', 'seat_number', 'seat_row', 'seat_column', 'seat_type', 'is_available', 'price'],
      order: [
        ['seat_row', 'ASC'],
        ['seat_column', 'ASC']
      ]
    });

    // Group seats by row
    const rows = {};
    seats.forEach(seat => {
      if (!rows[seat.seat_row]) {
        rows[seat.seat_row] = [];
      }
      rows[seat.seat_row].push(seat);
    });

    return {
      rows,
      totalSeats: seats.length,
      availableSeats: seats.filter(s => s.is_available).length,
      bookedSeats: seats.filter(s => !s.is_available).length
    };
  } catch (error) {
    throw error;
  }
};

export const getUserTravelStatsRepository = async (userId) => {
  try {
    // Get all confirmed bookings
    const bookings = await Booking.findAll({
      where: {
        user_id: userId,
        status: 'CONFIRMED'
      },
      include: [
        {
          model: Trip,
          as: 'trip',
          include: [
            {
              model: Vehicle,
              as: 'vehicle'
            }
          ]
        },
        {
          model: TripSeat,
          as: 'seats'
        }
      ]
    });

    // Calculate statistics
    const totalTrips = bookings.length;
    const totalSeatsBooked = bookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);
    const totalSpent = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    
    // Get favorite routes
    const routeCounts = {};
    bookings.forEach(booking => {
      if (booking.trip) {
        const key = `${booking.trip.departure_location} → ${booking.trip.arrival_location}`;
        routeCounts[key] = (routeCounts[key] || 0) + 1;
      }
    });

    // Sort routes by count
    const favoriteRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([route, count]) => ({ route, count }));

    // Get most used vehicle operator
    const operatorCounts = {};
    bookings.forEach(booking => {
      if (booking.trip && booking.trip.vehicle) {
        const operator = booking.trip.vehicle.operator_name;
        operatorCounts[operator] = (operatorCounts[operator] || 0) + 1;
      }
    });

    const favoriteOperators = Object.entries(operatorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([operator, count]) => ({ operator, count }));

    return {
      totalTrips,
      totalSeatsBooked,
      totalSpent,
      averageSpentPerTrip: totalTrips > 0 ? totalSpent / totalTrips : 0,
      favoriteRoutes,
      favoriteOperators,
      lastTravelDate: bookings.length > 0 ? bookings[0].booking_date : null
    };
  } catch (error) {
    throw error;
  }
};