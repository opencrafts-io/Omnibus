// repositories/adminDashboardRepository.js
import { Op, Sequelize } from "sequelize";
import { Booking, Trip, TripSeat, BookingSeat, Vehicle, User, Transaction } from "../Models/index.js";

export const getAdminDashboardStatsRepository = async (dateRange = 'month') => {
  try {
    // Date range filter
    let dateFilter = {};
    const now = new Date();
    
    switch(dateRange) {
      case 'today':
        dateFilter = {
          booking_date: {
            [Op.gte]: new Date(now.setHours(0, 0, 0, 0))
          }
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        dateFilter = {
          booking_date: {
            [Op.gte]: weekStart
          }
        };
        break;
      case 'month':
      default:
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          booking_date: {
            [Op.gte]: monthStart
          }
        };
        break;
    }

    // Get all bookings with filters
    const bookings = await Booking.findAll({
      where: {
        ...dateFilter,
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
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

    // Calculate stats
    const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalBookings = bookings.length;
    const totalSeats = bookings.reduce((sum, b) => sum + (b.seats ? b.seats.length : 0), 0);

    // Get active vehicles
    const activeVehicles = await Vehicle.count({
      where: {
        deleted_at: null
      },
      include: [
        {
          model: Trip,
          as: 'trips',
          where: {
            status: 'SCHEDULED',
            departure_time: { [Op.gte]: new Date() }
          }
        }
      ]
    });

    // Get total users
    const totalUsers = await User.count({
      where: {
        deleted_at: null
      }
    });

    // Get pending bookings
    const pendingBookings = await Booking.count({
      where: {
        status: 'PENDING',
        ...dateFilter
      }
    });

    // Calculate completion rate
    const completedBookings = await Booking.count({
      where: {
        status: 'COMPLETED',
        ...dateFilter
      }
    });
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate average rating (placeholder - you can add reviews later)
    const averageRating = 4.8;

    return {
      totalRevenue,
      totalBookings,
      totalTrips: await Trip.count({
        where: {
          status: 'SCHEDULED'
        }
      }),
      activeVehicles,
      totalUsers,
      pendingBookings,
      completionRate: parseFloat(completionRate.toFixed(1)),
      averageRating
    };
  } catch (error) {
    console.error('Error in getAdminDashboardStatsRepository:', error);
    throw error;
  }
};

export const getRevenueDataRepository = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get today's revenue
    const todayRevenue = await Booking.sum('total_amount', {
      where: {
        booking_date: { [Op.gte]: today },
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    // Get this week's revenue
    const weekRevenue = await Booking.sum('total_amount', {
      where: {
        booking_date: { [Op.gte]: weekStart },
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    // Get this month's revenue
    const monthRevenue = await Booking.sum('total_amount', {
      where: {
        booking_date: { [Op.gte]: monthStart },
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    // Get last month's revenue
    const lastMonthRevenue = await Booking.sum('total_amount', {
      where: {
        booking_date: { [Op.between]: [lastMonthStart, lastMonthEnd] },
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    // Calculate growth
    const growth = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    return {
      today: parseFloat(todayRevenue || 0),
      thisWeek: parseFloat(weekRevenue || 0),
      thisMonth: parseFloat(monthRevenue || 0),
      lastMonth: parseFloat(lastMonthRevenue || 0),
      growth: parseFloat(growth.toFixed(1))
    };
  } catch (error) {
    console.error('Error in getRevenueDataRepository:', error);
    throw error;
  }
};

export const getRecentBookingsAdminRepository = async (limit = 10) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        status: { [Op.not]: 'CANCELLED' }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Trip,
          as: 'trip',
          include: [
            {
              model: Vehicle,
              as: 'vehicle',
              attributes: ['id', 'operator_name', 'registration_number']
            }
          ]
        },
        {
          model: TripSeat,
          as: 'seats',
          attributes: ['id', 'seat_number']
        }
      ],
      order: [['booking_date', 'DESC']],
      limit: limit
    });

    return bookings.map(booking => booking.toJSON());
  } catch (error) {
    console.error('Error in getRecentBookingsAdminRepository:', error);
    throw error;
  }
};

export const getTopRoutesRepository = async (limit = 5) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        status: { [Op.in]: ['CONFIRMED', 'COMPLETED'] }
      },
      include: [
        {
          model: Trip,
          as: 'trip',
          attributes: ['departure_location', 'arrival_location'],
          include: [
            {
              model: TripSeat,
              as: 'seats'
            }
          ]
        }
      ],
      attributes: [
        'id',
        'total_amount'
      ]
    });

    // Aggregate routes
    const routeMap = {};
    bookings.forEach(booking => {
      if (booking.trip) {
        const key = `${booking.trip.departure_location} → ${booking.trip.arrival_location}`;
        if (!routeMap[key]) {
          routeMap[key] = {
            route: key,
            bookings: 0,
            revenue: 0,
            seats: 0
          };
        }
        routeMap[key].bookings += 1;
        routeMap[key].revenue += parseFloat(booking.total_amount || 0);
        routeMap[key].seats += booking.trip.seats ? booking.trip.seats.length : 0;
      }
    });

    // Calculate total for percentages
    const totalRevenue = Object.values(routeMap).reduce((sum, r) => sum + r.revenue, 0);

    // Sort and format
    const sortedRoutes = Object.values(routeMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(route => ({
        ...route,
        percentage: totalRevenue > 0 ? parseFloat(((route.revenue / totalRevenue) * 100).toFixed(1)) : 0,
        revenue: route.revenue
      }));

    return sortedRoutes;
  } catch (error) {
    console.error('Error in getTopRoutesRepository:', error);
    throw error;
  }
};

export const getFleetStatusRepository = async () => {
  try {
    const vehicles = await Vehicle.findAll({
      where: {
        deleted_at: null
      },
      include: [
        {
          model: Trip,
          as: 'trips',
          where: {
            status: 'SCHEDULED',
            departure_time: { [Op.gte]: new Date() }
          },
          required: false,
          include: [
            {
              model: TripSeat,
              as: 'seats'
            }
          ]
        }
      ]
    });

    return vehicles.map(vehicle => {
      const activeTrip = vehicle.trips && vehicle.trips.length > 0 ? vehicle.trips[0] : null;
      let status = 'inactive';
      let occupancy = 0;
      
      if (activeTrip) {
        status = 'active';
        const totalSeats = vehicle.total_seats || 1;
        const bookedSeats = activeTrip.seats ? activeTrip.seats.filter(s => !s.is_available).length : 0;
        occupancy = Math.round((bookedSeats / totalSeats) * 100);
      } else {
        // Check if vehicle has any upcoming trips
        const hasUpcomingTrips = vehicle.trips && vehicle.trips.length > 0;
        status = hasUpcomingTrips ? 'active' : 'inactive';
      }

      return {
        vehicle: vehicle.registration_number,
        operator: vehicle.operator_name,
        route: activeTrip ? `${activeTrip.departure_location} → ${activeTrip.arrival_location}` : 'No route assigned',
        status,
        capacity: vehicle.total_seats,
        occupancy
      };
    });
  } catch (error) {
    console.error('Error in getFleetStatusRepository:', error);
    throw error;
  }
};

export const getAdminDashboardSummaryRepository = async () => {
  try {
    // Get all stats in parallel for better performance
    const [
      stats,
      revenue,
      recentBookings,
      topRoutes,
      fleetStatus
    ] = await Promise.all([
      getAdminDashboardStatsRepository(),
      getRevenueDataRepository(),
      getRecentBookingsAdminRepository(5),
      getTopRoutesRepository(5),
      getFleetStatusRepository()
    ]);

    return {
      stats,
      revenue,
      recentBookings,
      topRoutes,
      fleetStatus
    };
  } catch (error) {
    console.error('Error in getAdminDashboardSummaryRepository:', error);
    throw error;
  }
};

export const searchBookingsAdminRepository = async (searchQuery) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [
          { booking_reference: { [Op.iLike]: `%${searchQuery}%` } },
          { '$user.name$': { [Op.iLike]: `%${searchQuery}%` } },
          { '$user.email$': { [Op.iLike]: `%${searchQuery}%` } },
          { '$trip.departure_location$': { [Op.iLike]: `%${searchQuery}%` } },
          { '$trip.arrival_location$': { [Op.iLike]: `%${searchQuery}%` } }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Trip,
          as: 'trip',
          include: [
            {
              model: Vehicle,
              as: 'vehicle'
            }
          ]
        }
      ],
      order: [['booking_date', 'DESC']]
    });

    return bookings.map(booking => booking.toJSON());
  } catch (error) {
    console.error('Error in searchBookingsAdminRepository:', error);
    throw error;
  }
};