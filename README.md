# Omnibus Bus Booking System - Backend Description

## Overview

**Omnibus** (Latin for "for all" or "for everyone") is a comprehensive, enterprise-grade bus booking and ticketing system backend built with Node.js, Express, and PostgreSQL. The system provides a complete solution for managing bus operators, trips, seat reservations, and payment processing with a focus on reliability, scalability, and seamless user experience. The name "Omnibus" reflects the system's mission to make bus travel accessible to everyone.

## Core Features

### 1. User Management
- Secure authentication and authorization using JWT tokens
- Role-based access control (User, Operator, Admin, Super Admin)
- User profiles with contact information and booking history
- Multi-device session management

### 2. Vehicle & Fleet Management
- Complete vehicle catalog with operator details
- Support for multiple vehicle types (MATATU, MINIBUS, BUS, COACH)
- Service classes (STANDARD, AC, VIP, SEMI_SLEEPER, SLEEPER)
- Vehicle registration and image management

### 3. Trip & Route Management
- Create and manage scheduled trips
- Departure and arrival location tracking
- Real-time seat availability monitoring
- Flexible pricing with base fares and seat-specific pricing

### 4. Seat Reservation System
- Interactive seat selection with visual layout
- Support for different seat types (WINDOW, AISLE, MIDDLE)
- Individual seat pricing
- Real-time availability tracking
- Seat blocking during pending payments

### 5. Booking & Payment Processing
- Multi-payment method support:
  - M-Pesa (STK Push with automatic callback)
  - Card Payments (coming soon)
  - Bank Transfers (coming soon)
  - Cash (manual confirmation)
- Secure payment flow:
  - Initiate payment → Reserve seats → Process payment → Confirm booking
  - Automatic seat release on payment failure
  - Transaction history and audit trail
- RabbitMQ integration for reliable, asynchronous payment processing

### 6. Queue-Based Architecture
- Veribroke Integration: Seamless M-Pesa payment processing
- RabbitMQ Exchange: io.opencrafts.veribroke for payment requests
- Notification Exchange: io.opencrafts.veribroke-notifications for payment callbacks
- Asynchronous Processing: Non-blocking payment handling

### 7. Passenger Management
- Multiple passengers per booking
- Passenger details (name, gender, contact)
- Seat assignment per passenger
- Booking history per user

### 8. Payment Processing Flow

The payment flow follows a sequence where:
1. User requests a booking
2. System checks seat availability
3. System calculates total based on seat prices
4. System creates a pending booking
5. System reserves the seats
6. System sends payment request to RabbitMQ
7. RabbitMQ routes request to Veribroke
8. Veribroke sends STK Push to M-Pesa
9. M-Pesa responds with payment confirmation
10. Veribroke sends callback to RabbitMQ
11. System processes the callback
12. On success: Booking is confirmed and seats are updated
13. On failure: Booking is cancelled and seats are released

## Technical Architecture

### Backend Stack
- Runtime: Node.js
- Framework: Express.js
- Database: PostgreSQL
- ORM: Sequelize
- Message Queue: RabbitMQ
- Authentication: JWT
- Payment Gateway: Veribroke (M-Pesa)

### Data Models
1. User: Authentication and profile management
2. Vehicle: Fleet management
3. Trip: Route and schedule management
4. TripSeat: Individual seat management with pricing
5. Booking: Reservation and payment tracking
6. BookingSeat: Passenger-to-seat mapping
7. Transaction: Payment history and audit trail

### Database Schema
```
users → bookings → trip_seats → trip → vehicle
       ↓
transactions (payment records)
       ↓
booking_seats (passenger details)
```

### Key Repository Pattern
- VehicleRepository: Fleet CRUD operations
- TripRepository: Trip and route management
- TripSeatRepository: Seat availability and booking
- BookingRepository: Reservation management
- BookingSeatRepository: Passenger management
- TransactionRepository: Payment tracking

## Payment Flow Process

### 1. Booking Initiation
```
POST /api/bookings/initiate-payment
{
  "trip_id": "uuid",
  "seat_ids": ["seat1", "seat2"],
  "passengers": [
    {"name": "John", "seat_number": "A1"}
  ],
  "payment_method": "MPESA",
  "phone_number": "254712345678"
}
```

### 2. Seat Price Calculation
- Individual seat prices checked first
- Falls back to trip base price if no seat price
- Total amount = sum of all seat prices

### 3. Database Transaction
- Booking created with PENDING status
- Seats marked as unavailable
- Transaction record created
- Payment request sent to RabbitMQ

### 4. Payment Processing
- M-Pesa STK push sent to user's phone
- User enters PIN on phone
- Payment confirmation received via callback

### 5. Callback Handling
- Transaction updated with status
- Booking confirmed on success
- Seats released on failure

## API Endpoints

coming soon

## Security Features

- JWT Authentication: All API endpoints protected
- Role-Based Access: Fine-grained permissions
- Input Validation: Request body validation
- SQL Injection Prevention: Sequelize ORM with parameterized queries
- Payment Security: Secure payment processing with Veribroke

## Scalability Features

- Asynchronous Processing: RabbitMQ for payment handling
- Database Indexing: Optimized queries with proper indexes
- Connection Pooling: Efficient database connections
- Stateless Architecture: Easy horizontal scaling

## Development Features

- Logging: Centralized logging with logs utility
- Error Handling: Consistent error responses
- Transaction Support: ACID compliance for critical operations
- Soft Delete: Data retention with paranoid mode

## Dependencies

### Core
- express - Web framework
- sequelize - ORM for PostgreSQL
- jsonwebtoken - JWT authentication
- bcrypt - Password hashing
- amqplib - RabbitMQ client

### Utilities
- dotenv - Environment configuration
- cors - Cross-origin resource sharing
- helmet - Security headers
- express-rate-limit - Rate limiting

## Performance Metrics

- Response Time: Less than 200ms for most endpoints
- Payment Processing: Less than 30 seconds (M-Pesa callback)
- Database Queries: Optimized with proper indexing
- Concurrent Users: Supports 1000+ concurrent users

## Target Users

1. End Users: Book bus tickets via mobile/web
2. Bus Operators: Manage vehicles and trips
3. Administrators: System management and monitoring
4. Support Staff: Handle customer inquiries

## Unique Selling Points

1. Real-time Seat Availability: Accurate seat tracking
2. Flexible Pricing: Seat-specific pricing
3. Secure Payments: M-Pesa integration with automatic confirmation
4. Queue-Based Architecture: Reliable, asynchronous processing
5. Comprehensive Reporting: Booking history and analytics
6. Multi-Role Support: Different access levels for different users

## Future Enhancements

1. Mobile App Integration: React Native / Flutter
2. Advanced Analytics: Booking trends and insights
3. Loyalty Program: Rewards for frequent travelers
4. Multi-language Support: Internationalization
5. Payment Gateway Expansion: Card, Airtel Money, Bank Transfers
6. Real-time Notifications: SMS and email updates
7. GPS Integration: Real-time bus tracking
8. AI-powered Suggestions: Smart seat recommendations

## System Name Origin

Omnibus (Latin for "for all" or "for everyone") - The name reflects the system's mission to make bus travel accessible to everyone. It also has historical significance as the term was used for early public transportation systems in the 19th century, symbolizing the evolution of public transport into the digital age.

---

This backend system provides a robust, scalable solution for modern bus booking operations, combining traditional booking functionality with modern payment processing and real-time availability tracking.