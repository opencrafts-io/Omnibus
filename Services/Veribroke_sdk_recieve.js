// services/mpesaConsumer.js
import amqp from "amqplib";
import { updateTransactionRepository } from "../Repositories/Transactions.repository.js";
import { updateBookingRepository, getBookingByIdRepository } from "../Repositories/Booking.repository.js";
import { getTripByIdRepository } from "../Repositories/Trip.repository.js";
import { getVehicleByIdRepository } from "../Repositories/Vehicle.repository.js";
import { Op, Sequelize } from "sequelize";
import sequelize from "../Utils/db.js";
import { logs } from "../Utils/logs.js";
import { TripSeat } from "../Models/index.js";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST;
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD;
const RABBITMQ_PORT = process.env.RABBITMQ_PORT;
const RABBITMQ_USER = process.env.RABBITMQ_USER;
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST;
const EXCHANGE_NAME = process.env.RABBITMQ_NOTIFICATION_EXCHANGE || "io.opencrafts.veribroke-notifications";
const LEOPHORIO_ROUTING_KEY = process.env.LEOPHORIO_ROUTING_KEY || "io.opencrafts.leophorio-mpesa";
const QUEUE = "io.opencrafts.leophorio.mpesa-success";
const RABBIT_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST || '/'}`;

export async function startMpesaSuccessConsumer() {
  const start = process.hrtime.bigint();

  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

    const q = await channel.assertQueue(QUEUE, {
      durable: true,
    });

    await channel.bindQueue(q.queue, EXCHANGE_NAME, LEOPHORIO_ROUTING_KEY);

    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "INFO", "RABBITMQ", "CONSUMER", "Monitoring Leophorío M-Pesa queues successfully", "/mpesa-consumer", 200, "system");

    channel.consume(
      q.queue,
      async (msg) => {
        if (!msg) return;
        
        const msgStart = process.hrtime.bigint();
        let transactionCommitted = false;
        let dbTransaction;

        try {
          dbTransaction = await sequelize.transaction();
          const payload = JSON.parse(msg.content.toString());
          const { request_id, success, message, metadata } = payload;
          const stkCallback = metadata?.Body?.stkCallback;

          // Log the received payload
          const msgDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
          logs(msgDuration, "INFO", "RABBITMQ", "CONSUMER", `Received M-Pesa response for request: ${request_id}`, "/mpesa-consumer", 200, "system");

          const MerchantRequestID = stkCallback?.MerchantRequestID;
          const CheckoutRequestID = stkCallback?.CheckoutRequestID;

          let status;
          let failure_reason = null;

          if (success) {
            status = "SUCCESS";
          } else if (message === "Request Cancelled by user") {
            status = "CANCELLED";
          } else {
            status = "FAILED";
          }

          if (!success) {
            failure_reason = message;
          }

          // Update transaction
          const transaction = await updateTransactionRepository(
            request_id,
            {
              checkout_request_id: CheckoutRequestID || null,
              merchant_request_id: MerchantRequestID || null,
              status,
              failure_reason,
              provider_response: stkCallback || null
            },
            { transaction: dbTransaction }
          );

          const plainTransaction = transaction.get({ plain: true });
          const { user_id, booking_id, trip_id, booking_reference } = plainTransaction;

          if (!booking_id) {
            throw new Error(`Booking ID not found in transaction: ${request_id}`);
          }

          // Get booking
          const booking = await getBookingByIdRepository(booking_id);
          if (!booking) {
            throw new Error(`Booking not found for booking_id: ${booking_id}`);
          }

          if (success) {
            // Update booking to CONFIRMED
            await updateBookingRepository(
              booking_id,
              {
                status: 'CONFIRMED',
                payment_status: 'PAID',
                updated_at: new Date()
              },
              { transaction: dbTransaction }
            );

            // Update trip available seats (decrease by number of seats booked)
            const trip = await getTripByIdRepository(trip_id);
            if (trip) {
              const seats = booking.seats || [];
              const newAvailableSeats = trip.available_seats - seats.length;
              
              await trip.update({
                available_seats: newAvailableSeats >= 0 ? newAvailableSeats : 0
              }, { transaction: dbTransaction });
            }

            const logDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
            logs(logDuration, "INFO", "RABBITMQ", "CONSUMER", `Booking ${booking_reference} confirmed successfully for user ${user_id}`, "/mpesa-consumer", 200, "system");
          } else {
            // Payment failed - cancel booking and release seats
            await updateBookingRepository(
              booking_id,
              {
                status: 'CANCELLED',
                payment_status: 'FAILED',
                updated_at: new Date()
              },
              { transaction: dbTransaction }
            );

            // Release seats back to available
            await TripSeat.update(
              {
                is_available: true,
                booking_id: null,
                booked_by: null
              },
              {
                where: {
                  booking_id: booking_id
                },
                transaction: dbTransaction
              }
            );

            const logDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
            logs(logDuration, "WARN", "RABBITMQ", "CONSUMER", `Booking ${booking_reference} cancelled due to payment failure. Seats released.`, "/mpesa-consumer", 200, "system");
          }

          // Commit database state
          await dbTransaction.commit();
          transactionCommitted = true;

          // Acknowledge the message
          channel.ack(msg);
          
          const finalDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
          logs(finalDuration, "INFO", "RABBITMQ", "CONSUMER", `Successfully processed booking ${booking_reference} with status: ${status}`, "/mpesa-consumer", 200, "system");

        } catch (error) {
          const errorDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
          logs(errorDuration, "ERR", "RABBITMQ", "CONSUMER", `Error processing queue message: ${error.message}`, "/mpesa-consumer", 500, "system");
          logs(errorDuration, "ERR", "RABBITMQ", "CONSUMER", `Error stack: ${error.stack}`, "/mpesa-consumer", 500, "system");
          
          // Only rollback if it hasn't been committed yet
          if (!transactionCommitted && dbTransaction) {
            try {
              await dbTransaction.rollback();
              const rollbackDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
              logs(rollbackDuration, "INFO", "RABBITMQ", "CONSUMER", "Transaction rolled back successfully", "/mpesa-consumer", 200, "system");
            } catch (rollbackError) {
              const rollbackDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
              logs(rollbackDuration, "ERR", "RABBITMQ", "CONSUMER", `Transaction rollback failed: ${rollbackError.message}`, "/mpesa-consumer", 500, "system");
            }
          }

          // Handle message acknowledgment
          if (transactionCommitted) {
            // If transaction was committed but something else failed, ack to avoid reprocessing
            channel.ack(msg);
          } else if (msg.fields.redelivered) {
            // If message was redelivered and failed again, ack to prevent infinite loop
            const warnDuration = Number(process.hrtime.bigint() - msgStart) / 1000;
            logs(warnDuration, "WARN", "RABBITMQ", "CONSUMER", "Message redelivered and failed again. Acking to prevent loop.", "/mpesa-consumer", 200, "system");
            channel.ack(msg);
          } else {
            // Nack and requeue for retry
            channel.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1000;
    logs(duration, "ERR", "RABBITMQ", "CONSUMER", `Leophorío M-Pesa consumer initialization error: ${error.message}`, "/mpesa-consumer", 500, "system");
    throw error;
  }
}