// repositories/tripRepository.js
import { Trip, Vehicle, TripSeat, Booking } from "../Models/index.js";
import { Op, Sequelize } from "sequelize";

export const createTripRepository = async (tripData, options = {}) => {
  try {
    const trip = await Trip.create(tripData, options);
    return trip;
  } catch (error) {
    throw error;
  }
};


export const getAllTripsRepository = async (limitPlusOne, offset, filters = {}) => {
  try {
    const whereClause = {};

    if (filters.departure_location) {
      whereClause.departure_location = { [Op.iLike]: `%${filters.departure_location}%` };
    }
    if (filters.arrival_location) {
      whereClause.arrival_location = { [Op.iLike]: `%${filters.arrival_location}%` };
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.departure_date) {
      const startDate = new Date(filters.departure_date);
      const endDate = new Date(filters.departure_date);
      endDate.setDate(endDate.getDate() + 1);
      whereClause.departure_time = {
        [Op.between]: [startDate, endDate]
      };
    }

    const trips = await Trip.findAll({
      where: whereClause,
      order: [["departure_time", "ASC"]],
      limit: limitPlusOne,
      offset,
      attributes: {
        include: [
          [
            // Using `${Trip.name}` dynamically references the exact model/table alias Sequelize uses
            Sequelize.literal(`(
              SELECT COUNT(*)::int
              FROM "trip_seats" AS "ts"
              WHERE "ts"."trip_id" = "${Trip.name}"."id"
                AND "ts"."is_available" = true
            )`),
            "available_seats"
          ]
        ],
        exclude: ["vehicle_id"]
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          // attributes: ["id", "operator_name", "vehicle_type", "service_class", "registration_number" , "vehicle_image"]
          
        }
      ]
    });

    return trips.map(trip => {
      const json = trip.toJSON();
      json.available_seats = parseInt(json.available_seats, 10) || 0;
      return json;
    });
  } catch (error) {
    throw error;
  }
};
export const getTripByIdRepository = async (tripId) => {
  try {
    const trip = await Trip.findByPk(tripId, {
      attributes: {
        exclude: ["vehicle_id"]
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle"
        },
        {
          model: TripSeat,
          as: "seats",
          attributes: {
            exclude: ["vehicle_id" , "trip_id"]
          },
          include: [
            {
              model: Booking,
              as: "booking",
              attributes: ["id", "status"],  
            }
          ]
        },
        {
          model: Booking,
          as: "bookings",
          where: { status: "CONFIRMED" },
          required: false,
          limit: 10
        }
      ]
    });
    return trip;
  } catch (error) {
    throw error;
  }
};

export const updateTripRepository = async (tripId, tripData) => {
  try {
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }
    await trip.update(tripData);
    return trip;
  } catch (error) {
    throw error;
  }
};

export const deleteTripRepository = async (tripId) => {
  try {
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return null;
    }
    await trip.destroy();
    return trip;
  } catch (error) {
    throw error;
  }
};

export const getTripsByVehicleRepository = async (vehicleId) => {
  try {
    const trips = await Trip.findAll({
      where: { vehicle_id: vehicleId },
      order: [["departure_time", "ASC"]],
    });
    return trips;
  } catch (error) {
    throw error;
  }
};

export const searchTripsRepository = async (searchQuery) => {
  try {
    const trips = await Trip.findAll({
      where: {
        [Op.or]: [
          { departure_location: { [Op.iLike]: `%${searchQuery}%` } },
          { arrival_location: { [Op.iLike]: `%${searchQuery}%` } }
        ],
        status: "SCHEDULED"
      },
      attributes: {
        exclude: ["vehicle_id"]
      },
      include: [
        {
          model: Vehicle,
          as: "vehicle"
        }
      ],
      order: [["departure_time", "ASC"]]
    });
    return trips;
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
      attributes: ["id", "seat_number", "seat_row", "seat_column", "seat_type", "price"]
    });
    return seats;
  } catch (error) {
    throw error;
  }
};