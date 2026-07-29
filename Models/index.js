// models/index.js
import User from './User.model.js';
import Vehicle from './Vehicle.model.js';
import Trip from './Trip.model.js';
import TripSeat from './Trip_seat.model.js';
import Booking from './Bookings.model.js';
import BookingSeat from './Booking_seats.model.js';
import Transaction from './transactions.model.js';

// ==================== USER ASSOCIATIONS ====================
// A User can have many Bookings
User.hasMany(Booking, {
  foreignKey: 'user_id',
  as: 'bookings'
});

// A User can have many TripSeats (booked seats)
User.hasMany(TripSeat, {
  foreignKey: 'booked_by',
  as: 'booked_seats'
});

// ==================== VEHICLE ASSOCIATIONS ====================
// A Vehicle can have many Trips
Vehicle.hasMany(Trip, {
  foreignKey: 'vehicle_id',
  as: 'trips'
});

// A Vehicle can have many TripSeats (across all trips)
Vehicle.hasMany(TripSeat, {
  foreignKey: 'vehicle_id',
  as: 'seats'
});

// ==================== TRIP ASSOCIATIONS ====================
// A Trip belongs to a Vehicle
Trip.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

// A Trip can have many Bookings
Trip.hasMany(Booking, {
  foreignKey: 'trip_id',
  as: 'bookings'
});

// A Trip can have many TripSeats
Trip.hasMany(TripSeat, {
  foreignKey: 'trip_id',
  as: 'seats'
});

// ==================== TRIPSEAT ASSOCIATIONS ====================
// A TripSeat belongs to a Trip
TripSeat.belongsTo(Trip, {
  foreignKey: 'trip_id',
  as: 'trip'
});

// A TripSeat belongs to a Vehicle
TripSeat.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  as: 'vehicle'
});

// A TripSeat belongs to a User (who booked it)
TripSeat.belongsTo(User, {
  foreignKey: 'booked_by',
  as: 'booked_by_user'
});

// A TripSeat belongs to a Booking
TripSeat.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

// ==================== BOOKING ASSOCIATIONS ====================
// A Booking belongs to a User
Booking.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// A Booking belongs to a Trip
Booking.belongsTo(Trip, {
  foreignKey: 'trip_id',
  as: 'trip'
});

// A Booking can have many TripSeats
Booking.hasMany(TripSeat, {
  foreignKey: 'booking_id',
  as: 'seats'
});

// A Booking can have many BookingSeats (passenger details)
Booking.hasMany(BookingSeat, {
  foreignKey: 'booking_id',
  as: 'passengers'
});

// ==================== BOOKINGSEAT ASSOCIATIONS ====================
// A BookingSeat belongs to a Booking
BookingSeat.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Transaction.belongsTo(Booking, {
  foreignKey: 'booking_id',
  as: 'booking'
});

Transaction.belongsTo(Trip, {
  foreignKey: 'trip_id',
  as: 'trip'
});

User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions'
});

Booking.hasMany(Transaction, {
  foreignKey: 'booking_id',
  as: 'transactions'
});

Trip.hasMany(Transaction, {
  foreignKey: 'trip_id',
  as: 'transactions'
});

// ==================== EXPORT ALL MODELS ====================
export {
  User,
  Vehicle,
  Trip,
  TripSeat,
  Booking,
  BookingSeat,
  Transaction
};